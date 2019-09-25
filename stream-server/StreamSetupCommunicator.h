#pragma once

#include <QObject>
#include <QJsonDocument>
#include <QJsonObject>
#include <QLocalSocket>
#include <QQueue>
#include "RemuxingContext.h"
#include <iostream>
#include <QTimer>
#include <QUuid>

class StreamSetupCommunicator : public QObject
{
	Q_OBJECT

	QLocalSocket _setupClient;
	QMap<QUuid, QString> _camIdMap;

	// class RemuxingContextBuilder
	// {
	// 	QString _cameraId;
	// public:
	// 	RemuxingContextBuilder(const QString& cameraId) : _cameraId(cameraId) {}
	// 	~RemuxingContextBuilder() { std::cout << __FUNCTION__ << std::endl; }
	// 	QSharedPointer<RemuxingContext> build(const QUrl& url)
	// 	{
	// 		std::cout << "check: " << qPrintable(url.toString(QUrl::None)) << std::endl;
	// 		QSharedPointer<RemuxingContext> remuxer(new RemuxingContext(qPrintable(url.toString(QUrl::None))));
	// 		return remuxer;
	// 	}
	// 	QString cameraId() const { return _cameraId; }
	// };

	//QQueue<QSharedPointer<RemuxingContextBuilder>> _requested;

signals:
	//void created(const QString& cameraId, QSharedPointer<RemuxingContext> context);
	void created(const QString& cameraId, const QUrl &url);

public:
	StreamSetupCommunicator(QObject* parent = nullptr) : QObject(parent)
	{
		connect(&_setupClient, &QLocalSocket::connected, []()
		{
			std::cout << "ipc socket connected" << std::endl;
		});
		connect(&_setupClient, &QLocalSocket::disconnected, [this]()
		{
			std::cout << "ipc socket disconnected" << std::endl;
			_setupClient.close();
			QTimer::singleShot(3000, [this]()
			{
				std::cout << "retry connect" << std::endl;
				_setupClient.connectToServer("WebStreamApp");
			});
		});
		connect(&_setupClient, &QLocalSocket::readyRead, [this]()
		{
			QUrl url;
			QString user;
			QString password;
			QString cameraId;
			auto doc = QJsonDocument::fromJson(_setupClient.readAll());
			if (doc.isObject()) {
				auto reply = doc.object();
				auto sid = reply["sid"].toString();
				if (reply["state"].toString() == "OK") {
					auto result = reply["result"];
					if (result.isObject()) {
						url = result.toObject()["url"].toString();
						//std::cout << "url: " << qPrintable(url) << std::endl;
						user = result.toObject()["user"].isString() ? result.toObject()["user"].toString() : "";
						password = result.toObject()["password"].isString() ? result.toObject()["password"].toString() : "";
						std::cout << "user: " << qPrintable(user) << ", password: " << qPrintable(password) << std::endl;
					}
				}
				cameraId = _camIdMap[sid];
				_camIdMap.remove(sid);
			}

			// auto builder = _requested.dequeue();
			if (!user.isEmpty()) {
			 	url.setUserName(user);
			 	url.setPassword(password);
			}
			// auto remuxer = builder->build(url);

			//std::cout << "check, camera ID: " << qPrintable(builder->cameraId()) << std::endl;
			//emit created(builder->cameraId(), remuxer);
			std::cout << "check, camera ID: " << qPrintable(cameraId) << std::endl;
			emit created(cameraId, url);

		});
		_setupClient.connectToServer("WebStreamApp");
	}

	void makeRemuxContext(const QString& cameraId)
	{
		QUuid sid = QUuid::createUuid();
		_camIdMap[sid] = cameraId;
		auto request = QJsonDocument(QJsonObject{
			{"sid", sid.toString() },
			{"cmd", "stream"},
			{"param", QJsonObject{{"id", cameraId}}}
		}).toJson();
		_setupClient.write(request);
		//_requested.enqueue(QSharedPointer<RemuxingContextBuilder>(new RemuxingContextBuilder{cameraId}));
	}
};