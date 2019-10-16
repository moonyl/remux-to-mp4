#pragma once

#include <QObject>
#include <QJsonDocument>
#include <QJsonObject>
#include <QLocalSocket>
#include "RemuxingContext.h"
#include <iostream>
#include <QTimer>
#include <QUuid>

class StreamSetupCommunicator : public QObject
{
	Q_OBJECT

	QScopedPointer<QLocalSocket> _setupClient;
	QMap<QUuid, QString> _camIdMap;
	const QString _connectName{"WebStreamApp"};

signals:
	void created(const QString& cameraId, const QUrl &url);

public:
	StreamSetupCommunicator(QObject* parent = nullptr) : QObject(parent)
	{
		// connect(&_setupClient, &QLocalSocket::connected, []()
		// {
		// 	std::cout << "ipc socket connected" << std::endl;
		// });
		// connect(&_setupClient, &QLocalSocket::disconnected, [this]()
		// {
		// 	std::cout << "ipc socket disconnected" << std::endl;
		// 	_setupClient.close();			
		// 	QTimer::singleShot(3000, [this]()
		// 	{
		// 		std::cout << "retry connect" << std::endl;
		// 		_setupClient.abort();
		// 		_setupClient.connectToServer("WebStreamApp");
		// 	});
		// });
		// connect(&_setupClient, &QLocalSocket::readyRead, [this]()
		// {
		// 	QUrl url;
		// 	QString user;
		// 	QString password;
		// 	QString cameraId;
		// 	auto doc = QJsonDocument::fromJson(_setupClient.readAll());
		// 	if (doc.isObject()) {
		// 		auto reply = doc.object();
		// 		auto sid = reply["sid"].toString();
		// 		if (reply["state"].toString() == "OK") {
		// 			auto result = reply["result"];
		// 			if (result.isObject()) {
		// 				url = result.toObject()["url"].toString().trimmed();
		// 				//std::cout << "url: " << qPrintable(url) << std::endl;
		// 				user = result.toObject()["user"].isString() ? result.toObject()["user"].toString() : "";
		// 				password = result.toObject()["password"].isString() ? result.toObject()["password"].toString() : "";
		// 				std::cout << "user: " << qPrintable(user) << ", password: " << qPrintable(password) << std::endl;
		// 			}
		// 		}
		// 		cameraId = _camIdMap[sid];
		// 		_camIdMap.remove(sid);
		// 	}
		//
		// 	// auto builder = _requested.dequeue();
		// 	std::cout << "url isEmpty(): " << url.isEmpty() << std::endl;
		// 	if (!url.isEmpty() && !user.isEmpty()) {
		// 	 	url.setUserName(user);
		// 	 	url.setPassword(password);
		// 	}
		// 	// auto remuxer = builder->build(url);
		//
		// 	//std::cout << "check, camera ID: " << qPrintable(builder->cameraId()) << std::endl;
		// 	//emit created(builder->cameraId(), remuxer);
		// 	std::cout << "check, camera ID: " << qPrintable(cameraId) << std::endl;
		// 	emit created(cameraId, url);
		//
		// });
		_setupClient.reset(new QLocalSocket);
		setupSocket();
		_setupClient->connectToServer(_connectName);
	}

	bool makeRemuxContext(const QString& cameraId)
	{
		std::cout << "localsocket valid: " << _setupClient->isValid() << std::endl;
		if (!_setupClient->isValid()) {
			return false;
		}
		QUuid sid = QUuid::createUuid();
		_camIdMap[sid] = cameraId;
		auto request = QJsonDocument(QJsonObject{
			{"sid", sid.toString() },
			{"cmd", "stream"},
			{"param", QJsonObject{{"id", cameraId}}}
		}).toJson();
		_setupClient->write(request);
		//_requested.enqueue(QSharedPointer<RemuxingContextBuilder>(new RemuxingContextBuilder{cameraId}));
		return true;
	}

private:
	void setupSocket()
	{
		connect(_setupClient.get(), &QLocalSocket::connected, []()
		{
			std::cout << "ipc socket connected" << std::endl;
		});
		connect(_setupClient.get(), &QLocalSocket::disconnected, [this]()
		{
			std::cout << "ipc socket disconnected" << std::endl;
			_setupClient->close();			
			QTimer::singleShot(3000, [this]()
			{
				std::cout << "retry connect" << std::endl;
				//_setupClient->abort();
				_setupClient.reset(new QLocalSocket);
				setupSocket();
				_setupClient->connectToServer(_connectName);
			});
		});
		connect(_setupClient.get(), &QLocalSocket::readyRead, [this]()
		{
			QUrl url;
			QString user;
			QString password;
			QString cameraId;
			auto doc = QJsonDocument::fromJson(_setupClient->readAll());
			if (doc.isObject()) {
				auto reply = doc.object();
				auto sid = reply["sid"].toString();
				if (reply["state"].toString() == "OK") {
					auto result = reply["result"];
					if (result.isObject()) {
						url = result.toObject()["url"].toString().trimmed();
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
			std::cout << "url isEmpty(): " << url.isEmpty() << std::endl;
			if (!url.isEmpty() && !user.isEmpty()) {
			 	url.setUserName(user);
			 	url.setPassword(password);
			}
			// auto remuxer = builder->build(url);

			//std::cout << "check, camera ID: " << qPrintable(builder->cameraId()) << std::endl;
			//emit created(builder->cameraId(), remuxer);
			std::cout << "check, camera ID: " << qPrintable(cameraId) << std::endl;
			emit created(cameraId, url);

		});
	}
};
