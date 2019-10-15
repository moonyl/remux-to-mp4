#include "OnvifRequestProcessor.h"

OnvifRequestProcessor::OnvifRequestProcessor(QLocalSocket* client, OnvifDeviceScanner& scanner): _devScanner(scanner), _sender(client),
                                                                                                             _discoveryHandler(_devScanner, _sender),
                                                                                                             _authHandler(_sender)
{
	_rootHandler = &_discoveryHandler;
	_rootHandler->addHandler(&_authHandler);
	//handle();
	_sender.setReplyHandle([this](const QJsonDocument& json)
	{
		_rootHandler->handle(json);
	});

	QObject::connect(&_sender, &ResultSender::handleDone, [this]()
	{
		if (_handleDone) {
			_handleDone();
		}
	});
}

void OnvifRequestProcessor::setHandleDone(std::function<void()> handleDone)
{
	_handleDone = handleDone;
}
