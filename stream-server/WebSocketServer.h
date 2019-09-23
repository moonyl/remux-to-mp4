
#pragma once

#include <QWebSocketServer>
#include "WebSocketRouter.h"

class QWebSocket;

class WebSocketServer : public QObject
{
	Q_OBJECT
public:
	WebSocketServer(WebSocketRouter& router, QObject* parent = nullptr);

private slots:
	void handleNewConnect();
	
private:	
	QWebSocketServer _socketServer;

	WebSocketRouter& _router;
};
