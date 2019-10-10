
#pragma once

#include <QLocalSocket>
#include "OnvifDeviceScanner.h"

class OnvifDiscoveryClientHandler : public QObject
{
	Q_OBJECT
	
	OnvifDeviceScanner &_scanner;
	QUuid _sessionId;
	QLocalSocket *_client;
	
public:
	OnvifDiscoveryClientHandler(QLocalSocket* client, OnvifDeviceScanner &scanner, QObject* parent = nullptr)
		: QObject(parent), _scanner(scanner), _client(client)
	{		
		handle();
	}

	~OnvifDiscoveryClientHandler()
	{
		_client->deleteLater();
	}
	
signals:
	void handleDone();
	
private:
	void handle()
	{
		connect(_client, &QLocalSocket::disconnected, this, &OnvifDiscoveryClientHandler::handleSocketDisconnected);	
		
		connect(_client, &QLocalSocket::readyRead, [this]()
		{
			auto data = _client->readAll();
			auto json = QJsonDocument::fromJson(data);
			if (json.isObject()) {
				if (json["cmd"] == "discovery") {
					std::cout << "received discovery" << std::endl;
					auto interfaces = loadNetworkInterfaces();
					QList<QHostAddress> addrs;						
					for (const auto& niu : interfaces) {
						addrs << niu.first;
					}
					_sessionId = QUuid::createUuid();
					connect(&_scanner, &OnvifDeviceScanner::deviceFound, this, &OnvifDiscoveryClientHandler::handleDeviceFound);
					_scanner.scan(_sessionId, addrs);
				}
			}
		});
	}

private slots:
	void handleSocketDisconnected()
	{
		std::cout << "client will be deleted" << std::endl;
		emit handleDone();
		//_client->deleteLater();		
	}
	
	void handleDeviceFound(const QByteArray& result)
	{
		// TODO : 보낸 session id와 일치하는가?
		std::cout << "device found" << std::endl;
		auto json = QJsonDocument::fromJson(result);
		if (json.isObject()) {
			if (_sessionId == QUuid(json["session"].toString()))
			{
				// TODO : 소켓을 통해 전달
				_client->write(result);
				//emit handleDone();
			}
			//std::cout << qPrintable(json["session"].toString()) << std::endl;
		}		
		//std::cout << qPrintable(result) << std::endl;
	}
};