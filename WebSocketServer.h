
#pragma once

#include <QWebSocketServer>
#include "Mp4RemuxManager.h"

class QWebSocket;

class WebSocketServer : public QObject
{
	Q_OBJECT
public:
	WebSocketServer(QObject* parent = nullptr);

private slots:
	void handleNewConnect();
	//void handleDisconnect();
	//void handleTextMessage(const QString& message);
	
private:	
	QWebSocketServer _socketServer;
	//QWebSocket* _socket;

	Mp4RemuxManager _remuxer;
};
