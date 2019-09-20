
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
	
private:	
	QWebSocketServer _socketServer;

	Mp4RemuxManager _remuxer;
};
