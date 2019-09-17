#pragma once

#include <QTimer>
#include "RemuxingContext.h"
#include <iostream>
#include <QRegularExpression>
#include <QUuid>

class QWebSocket;

class Mp4RemuxManager : public QObject
{
	Q_OBJECT

	QMap<QUuid, QSharedPointer<RemuxingContext>> _remuxerMap;
	QTimer _timer;

public:
	Mp4RemuxManager(QObject* parent = nullptr) : QObject(parent)//, _remuxer(in_filename)
	{
		_timer.setInterval(0);
		connect(&_timer, &QTimer::timeout, [this]() {
			for(const auto& key : _remuxerMap.keys()) {
				bool working = _remuxerMap[key]->remux();
				if (!working) {
					_remuxerMap.remove(key);
				}
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
			// TODO : 서버로부터 URL과 계정 정보를 얻어온 후, RemuxingContext 를 생성한다.
			if (!_remuxerMap.contains(cameraId)) {
				QSharedPointer<RemuxingContext> remuxer(new RemuxingContext("rtsp://192.168.15.11/Apink_I'mSoSick_720_2000kbps.mp4"));
				//_remuxer.addSocket(socket);
				remuxer->addSocket(socket);
				_remuxerMap[cameraId] = remuxer;
				connect(socket, &QWebSocket::textMessageReceived, this, &Mp4RemuxManager::handleTextMessageReceived);
				connect(socket, &QWebSocket::disconnected, this, &Mp4RemuxManager::handleDisconnected);
			}

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
