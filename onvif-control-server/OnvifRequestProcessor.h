#pragma once

#include <QtNetwork/QLocalServer>
#include "onvifHandlers.h"

class OnvifRequestProcessor
{
	BaseHandler* _rootHandler;
	DeviceScanner _devScanner;
	ResultSender _sender;
	DiscoveryHandler _discoveryHandler;
	AuthHandler _authHandler;
	std::function<void()> _handleDone;

public:
	OnvifRequestProcessor(QLocalSocket* client, OnvifDeviceScanner& scanner);

	void setHandleDone(std::function<void()> handleDone);
};
