#pragma once

#include <QTimer>
#include "RemuxingContext.h"
#include <iostream>
#include <QRegularExpression>
#include <QUuid>
#include "StreamSetupCommunicator.h"

class QWebSocket;



class Mp4RemuxManager : public QObject
{
	Q_OBJECT

	QMap<QUuid, QSharedPointer<RemuxingContext>> _remuxerMap;
	QTimer _timer;
	StreamSetupCommunicator _communicator;
	
public:
	Mp4RemuxManager(QObject* parent = nullptr) : QObject(parent), _communicator(this)
	{
		_timer.setInterval(0);
		connect(&_timer, &QTimer::timeout, [this]() {
			QList<QUuid> tobeRemoved;
			for(const auto& key : _remuxerMap.keys()) {
				auto result = _remuxerMap[key]->remux();
				_remuxerMap[key]->sendRemuxed(result);
				if (_remuxerMap[key]->isStreamEnded()) {
					tobeRemoved << key;
				}
			}
			for (const auto&key : tobeRemoved) {
				_remuxerMap.remove(key);
			}			
			
			if (_remuxerMap.isEmpty()) {
				_timer.stop();
			}
		});
	}

	void addSocket(QWebSocket* socket)
	{
		QRegularExpression re("/livews/(\\s*([a-f0-9\\-]*){1}\\s*)/*");
		auto match = re.match(socket->requestUrl().path());
		if (match.hasMatch()) {
			auto cameraId = match.captured(1);
			std::cout << "camera ID: " << qPrintable(cameraId) << std::endl;

			if (!_remuxerMap.contains(cameraId)) {
				_communicator.makeRemuxContext(cameraId);
				connect(&_communicator, &StreamSetupCommunicator::created, [this, socket](const QString& cameraId, QSharedPointer<RemuxingContext> context)
				{
					context->addSocket(socket);
					_remuxerMap[cameraId] = context;
				});
			}
			connect(socket, &QWebSocket::textMessageReceived, this, &Mp4RemuxManager::handleTextMessageReceived);
			connect(socket, &QWebSocket::disconnected, this, &Mp4RemuxManager::handleDisconnected);
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
			start();
		}
	}
	
private:	
	void start()
	{
		_timer.start();
	}
};
