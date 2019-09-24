#pragma once

#include <QTimer>
#include "RemuxingContext.h"
#include <iostream>
#include <QRegularExpression>
#include <QUuid>
#include "StreamSetupCommunicator.h"
#include "RemuxerManager.h"

class QWebSocket;

class WebSocketRouter : public QObject
{
Q_OBJECT

	//QMap<QUuid, QSharedPointer<RemuxingContext>> _remuxerMap;
	RemuxerManager& _remuxerManager;
	//QTimer _timer;
	//StreamSetupCommunicator _communicator;

public:
	WebSocketRouter(RemuxerManager& remuxerManager, QObject* parent = nullptr) : QObject(parent), _remuxerManager(remuxerManager)
	{
		// _timer.setInterval(0);
		// connect(&_timer, &QTimer::timeout, [this]()
		// {
		// 	QList<QUuid> tobeRemoved;
		// 	for (const auto& remuxer : _remuxerManager.remuxers()) {
		// 		auto result = remuxer->remux();
		// 		remuxer->sendRemuxed(result);
		// 	}
		// 	_remuxerManager.cleanupEnded();
		//
		// 	if (_remuxerManager.isEmpty()) {
		// 		_timer.stop();
		// 	}
		// });
	}

	void addSocket(QWebSocket* socket)
	{
		QRegularExpression re("/livews/(\\s*([a-f0-9\\-]*){1}\\s*)/*");
		auto match = re.match(socket->requestUrl().path());
		if (match.hasMatch()) {
			auto cameraId = match.captured(1);
			std::cout << "camera ID: " << qPrintable(cameraId) << std::endl;

			_remuxerManager.update(cameraId, socket);

			connect(socket, &QWebSocket::textMessageReceived, this, &WebSocketRouter::handleTextMessageReceived);
			connect(socket, &QWebSocket::disconnected, this, &WebSocketRouter::handleDisconnected);
		}
	}

private slots:
	void handleDisconnected()
	{
		QWebSocket* pClient = qobject_cast<QWebSocket*>(sender());
		std::cout << "socket disconnected" << std::endl;		
		pClient->deleteLater();		
	}

	void handleTextMessageReceived(const QString& textMesage)
	{
		if (textMesage == "start") {
			_remuxerManager.startRemux();
		}
	}
};
