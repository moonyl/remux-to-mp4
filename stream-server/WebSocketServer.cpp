
#include "WebSocketServer.h"
#include <iostream>


WebSocketServer::WebSocketServer(WebSocketRouter& router, QObject* parent) :
	QObject(parent),
	_router(router),
    _socketServer("Websocket Server", QWebSocketServer::NonSecureMode)
{
	_socketServer.close();
	_socketServer.listen(QHostAddress::LocalHost, 3001);

	connect(&_socketServer, &QWebSocketServer::newConnection, this, &WebSocketServer::handleNewConnect);
	
}

void WebSocketServer::handleNewConnect()
{
	std::cout << "websocket new connection" << std::endl;
	auto socket = _socketServer.nextPendingConnection();
		
	_router.addSocket(socket);
}
