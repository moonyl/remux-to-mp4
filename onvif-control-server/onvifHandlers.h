#pragma once

#include <onvifkit/SoapContext.h>
#include <QMetaObject>
#include "OnvifDeviceScanner.h"
#include <QLocalSocket>
#include <onvifkit/OnvifSession.h>
#include "utils.h"

class BaseHandler
{
	BaseHandler* _next = nullptr;
public:
	virtual bool match(const QJsonDocument& cmd) = 0;
	virtual void doTask(const QJsonValue& param) = 0;
	virtual void handle(const QJsonDocument& cmd);
	void addHandler(BaseHandler* handler);
};

class DeviceScanner
{
	OnvifDeviceScanner& _scanner;
public:
	DeviceScanner(OnvifDeviceScanner& scanner);
	void scanDevices(const QUuid sessionId, const QList<QHostAddress>& addrs, std::function<void(const QByteArray&)> handleFound);
};

class ResultSender : public QObject
{
Q_OBJECT

	QLocalSocket* _client;
	std::function<void(const QJsonDocument& jsonResult)> _handleReply;

public:
	ResultSender(QLocalSocket* client, QObject* parent = nullptr);

	~ResultSender();

	void setReplyHandle(std::function<void(const QJsonDocument& jsonResult)> handleReply);

	void sendResult(const QByteArray& jsonResult);

signals:
	void handleDone();

private slots:
	void handleSocketDisconnected()
	{
		std::cout << "client will be deleted" << std::endl;
		emit handleDone();
		//_client->deleteLater();		
	}
};

class DiscoveryHandler : public BaseHandler
{
	QUuid _sessionId;
	//OnvifDiscoveryClientHandler &_scanner;
	DeviceScanner& _devScanner;
	ResultSender& _sender;

public:
	DiscoveryHandler(DeviceScanner& devScanner, ResultSender& sender) : _devScanner(devScanner), _sender(sender) {}
	bool match(const QJsonDocument& cmd);
	void doTask(const QJsonValue& param);
};

QList<OnvifMediaProfile> mediaProfilesFromOnvifSession(const OnvifSession& session);

QJsonArray makeMediaProfilesToJson(const QList<OnvifMediaProfile>& profileList);

class OnvifServiceInformer
{
	QScopedPointer<OnvifSession> _session;
	std::function<void(const QByteArray&)> _onOk;
	std::function<void(const QByteArray&)> _onError;
public:
	//~OnvifServiceInformer() { std::cout << "check " << __FUNCTION__ << std::endl;}
	OnvifServiceInformer(const QUrl& url, const QString& user, const QString& password,
		std::function<void(const QByteArray&)> onOk, std::function<void(const QByteArray&)> onError);
};

class AuthHandler : public BaseHandler
{
	QUuid _sessionId;
	ResultSender& _sender;
	std::function<void()> _sendOnvifRequestResult;
	std::function<void(const QByteArray& result)> _sendOnvifSessionResult;
	QScopedPointer<OnvifServiceInformer> _informer;

public:
	AuthHandler(ResultSender& sender) : _sender(sender) {}
	bool match(const QJsonDocument& cmd);
	void doTask(const QJsonValue& param);
};
