#pragma once

#include <basekit/Exception.h>
#include "OnvifRequestProcessor.h"

class OnvifDiscoveryService
{
	QLocalServer _server;
	OnvifDeviceScanner _scanner;
	QSet<OnvifRequestProcessor*> _handlers;
	
public:
	OnvifDiscoveryService()
	{
		service();
	}

private:	
	void service()
	{		
		QString serverName{"OnvifApp"};
		if (!_server.listen(serverName)) {
			QLocalServer::removeServer(serverName);
			if (!_server.listen(serverName)) {
				throw EXCEPTION_MESSAGE(Exception, -1, "local server cannot listen");
			}
		}

		QObject::connect(&_server, &QLocalServer::newConnection, [this]()
		{
			QLocalSocket* client = _server.nextPendingConnection();
			auto handler = new OnvifRequestProcessor(client, _scanner);
			std::cout << "before: " << handler << std::endl;

			handler->setHandleDone([handler, this]()
			{
				std::cout << "after: " << handler << std::endl;				
				_handlers.remove(handler);
				//handler->deleteLater();
				delete handler;
			});

			_handlers << handler;
		});
	}
};