#pragma once

#include <QObject>
#include <QJsonDocument>
#include <QJsonObject>
#include <QLocalSocket>
#include <QQueue>
#include <QWebSocket>
#include "RemuxingContext.h"

class StreamSetupCommunicator : public QObject
{
	Q_OBJECT

		QLocalSocket _setupClient;

	class RemuxingContextBuilder
	{
		QWebSocket* _socket;
		QString _cameraId;
	public:
		RemuxingContextBuilder(QWebSocket* socket, const QString& cameraId) : _socket(socket), _cameraId(cameraId) {}
		~RemuxingContextBuilder() { std::cout << __FUNCTION__ << std::endl; }
		QSharedPointer<RemuxingContext> build(const QUrl& url)
		{
			QSharedPointer<RemuxingContext> remuxer(new RemuxingContext(qPrintable(url.toString())));
			// 	//_remuxer.addSocket(socket);
			remuxer->addSocket(_socket);
			return remuxer;
		}
		QString cameraId() const { return _cameraId; }
	};

	QQueue<QSharedPointer<RemuxingContextBuilder>> _requested;

signals:
	void created(const QString& cameraId, QSharedPointer<RemuxingContext> context);

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
				//std::cout << qPrintable(_setupClient.readAll());
				//auto received = _setupClient.readAll();
				QString url;
				auto doc = QJsonDocument::fromJson(_setupClient.readAll());
				if (doc.isObject()) {
					auto reply = doc.object();
					if (reply["state"].toString() == "OK") {
						auto result = reply["result"];
						if (result.isObject()) {
							url = result.toObject()["url"].toString();
							std::cout << "url: " << qPrintable(url) << std::endl;
						}
					}
				}

				auto builder = _requested.dequeue();
				auto remuxer = builder->build(url);
				std::cout << "check, camera ID: " << qPrintable(builder->cameraId()) << std::endl;
				//_remuxerMap[builder->cameraId()] = remuxer;
				emit created(builder->cameraId(), remuxer);
			});
		_setupClient.connectToServer("WebStreamApp");
	}

	void makeRemuxContext(const QString& cameraId, QWebSocket* socket)
	{
		auto request = QJsonDocument(QJsonObject{
			{"cmd", "stream"},
			{"param", QJsonObject{ {"id", cameraId}} }
			}).toJson();
			_setupClient.write(request);
			_requested.enqueue(QSharedPointer<RemuxingContextBuilder>(new RemuxingContextBuilder{ socket, cameraId }));
	}
};