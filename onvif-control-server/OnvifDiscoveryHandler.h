#pragma once

#include <QLocalSocket>
#include "OnvifDeviceScanner.h"

class BaseHandler
{
	BaseHandler* _next = nullptr;
public:
	virtual bool match(const QJsonDocument& cmd) = 0;
	virtual void doTask(const QJsonValue& param) = 0;
	virtual void handle(const QJsonDocument& cmd)
	{
		if (!match(cmd)) {
			if (!_next) {
				return;
			}
			_next->handle(cmd);
			return;
		}
		doTask(cmd["param"]);
	}
	void addHandler(BaseHandler* handler)
	{
		if (!_next) {
			_next = handler;
			return;
		}
		_next->addHandler(handler);
	}
};

class ResultSender : public QObject
{
Q_OBJECT

	QLocalSocket* _client;
	std::function<void(const QJsonDocument& jsonResult)> _handleReply;

public:
	ResultSender(QLocalSocket* client, QObject* parent = nullptr) : QObject(parent), _client(client)
	{
		connect(_client, &QLocalSocket::disconnected, this, &ResultSender::handleSocketDisconnected);

		connect(_client, &QLocalSocket::readyRead, [this]()
		{
			auto data = _client->readAll();
			auto json = QJsonDocument::fromJson(data);
			if (_handleReply) {
				_handleReply(json);
			}
		});
	}

	~ResultSender()
	{
		_client->deleteLater();
	}

	void setReplyHandle(std::function<void(const QJsonDocument& jsonResult)> handleReply)
	{
		_handleReply = handleReply;
	}

	void sendResult(const QByteArray& jsonResult)
	{
		_client->write(jsonResult);
	}

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

class DeviceScanner
{
	OnvifDeviceScanner& _scanner;
public:
	DeviceScanner(OnvifDeviceScanner& scanner) : _scanner(scanner) {}
	void scanDevices(const QUuid sessionId, const QList<QHostAddress>& addrs, std::function<void(const QByteArray&)> handleFound)
	{
		QObject::connect(&_scanner, &OnvifDeviceScanner::deviceFound, handleFound);
		_scanner.scan(sessionId, addrs);
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
	bool match(const QJsonDocument& cmd)
	{
		if (!cmd.isObject()) {
			return false;
		}

		if (cmd["cmd"] != "discovery") {
			return false;
		}
		return true;
	}

	void doTask(const QJsonValue& param)
	{
		std::cout << "received discovery" << std::endl;
		auto interfaces = loadNetworkInterfaces();
		QList<QHostAddress> addrs;
		for (const auto& niu : interfaces) {
			addrs << niu.first;
		}
		_sessionId = QUuid::createUuid();
		//connect(&_scanner, &OnvifDeviceScanner::deviceFound, this, &OnvifDiscoveryClientHandler::handleDeviceFound);
		_devScanner.scanDevices(_sessionId, addrs, [this](const QByteArray& jsonByteArray)
		{
			// TODO : 보낸 session id와 일치하는가?
			std::cout << "device found" << std::endl;
			auto json = QJsonDocument::fromJson(jsonByteArray);
			if (json.isObject()) {
				if (_sessionId == QUuid(json["session"].toString())) {
					_sender.sendResult(jsonByteArray);
				}
			}
		});
	}
};

#include <onvifkit/OnvifSession.h>
#include <onvifkit/OnvifConst.h>

inline QList<OnvifMediaProfile> mediaProfilesFromOnvifSession(const OnvifSession& session)
{
	auto mediaServiceMap = session.values(OnvifServiceCategory::Media);
	int count = mediaServiceMap.value(OnvifKey::Media::ProfileCount).toInt();
	QList<OnvifMediaProfile> profileList;
	for (int i = 0; i < count; ++i) {
		profileList << mediaServiceMap.value(MK_KEY(OnvifKey::Media::iProfile, i)).value<OnvifMediaProfile>();
	}
	return profileList;
}

inline QJsonArray makeMediaProfilesToJson(const QList<OnvifMediaProfile>& profileList)
{
	QJsonArray jsonProfiles;
	for (const auto& profile : profileList) {
		jsonProfiles << QJsonObject({
			{"codec", codecText(profile.video().codec())}, {"width", profile.video().width()},
			{"height", profile.video().height()}, {"name", profile.name()}, {"url", profile.uri()}
		});
		//std::cout << qPrintable(item.ip()) << ", " << qPrintable(item.xaddrs()[0]) << ", " << qPrintable(item.modelName()) << std::endl;	
	}

	return jsonProfiles;
	// return 
	// return QJsonDocument(QJsonObject{ {"state", true}, {"result", result} }).toJson();
}

inline std::ostream& operator<<(std::ostream& os, const QString& str)
{
	os << qPrintable(str);
	return os;
}

inline std::ostream& operator<<(std::ostream& os, const QByteArray& str)
{
	os << qPrintable(str);
	return os;
}

class OnvifServiceInformer
{
	QScopedPointer<OnvifSession> _session;
	std::function<void(const QByteArray&)> _onOk;
	std::function<void(const QByteArray&)> _onError;
public:
	~OnvifServiceInformer() { std::cout << "check " << __FUNCTION__ << std::endl;}
	OnvifServiceInformer(const QUrl& url, const QString& user, const QString& password, 
		std::function<void(const QByteArray&)> onOk, std::function<void(const QByteArray&)> onError)
			: _session(new OnvifSession), _onOk(onOk), _onError(onError)
	{
		QObject::connect(_session.data(), &OnvifSession::sessionReady, [this](qint64 handle)
		{
			QJsonObject result { {"state", true}};
			std::cout << "session ready, " << handle << std::endl;
			if (_session->hasService(OnvifServiceCategory::Media)) {				
				auto jsonProfiles = makeMediaProfilesToJson(mediaProfilesFromOnvifSession(*_session));
				//std::cout << qPrintable(jsonProfiles) << std::endl;
				result.insert("media", jsonProfiles);
			}

			if (_session->hasService(OnvifServiceCategory::Ptz)) {
				std::cout << qPrintable("Ptz Capable") << std::endl;
				result.insert("ptz", true);
			}

			std::cout << qPrintable(QJsonDocument(result).toJson()) << std::endl;
			if (_onOk) {
				_onOk(QJsonDocument(result).toJson());
			}
		});

		QObject::connect(_session.data(), &OnvifSession::sessionError, [&](qint64 handle, int err, const QString& errText)
		{
			//std::cout << "onvif session Error: " << handle << ", " << qPrintable(errText) << endl;
			QJsonObject result { {"state", false}, {"error", errText}};
			std::cout << QJsonDocument(result).toJson() << std::endl;
			if (_onError) {
				_onError(QJsonDocument(result).toJson());
			}
		});

		// TODO: 어떤 상황인지 인지하지 못했다.
		QObject::connect(_session.data(), &OnvifSession::onvifError, [](qint64 handle, OnvifServiceCategory category, const OnvifReply& reply)
		{
			std::cout << "onvifError: " << handle << endl;
		});

		_session->open(url, user.toLatin1(), password.toLatin1(), 30);
	}
};

#include <onvifkit/SoapContext.h>
#include <onvifkit/service/device/OnvifAuthenticationRequest.h>
#include <QMetaObject>

class AuthHandler : public BaseHandler
{
	QUuid _sessionId;
	ResultSender& _sender;
	std::function<void()> _sendOnvifRequestResult;
	std::function<void(const QByteArray& result)> _sendOnvifSessionResult;
	QScopedPointer<OnvifServiceInformer> _informer;
	
public:
	AuthHandler(ResultSender& sender) : _sender(sender) {}
	bool match(const QJsonDocument& cmd)
	{
		if (!cmd.isObject()) {
			return false;
		}

		std::cout << "cmd: " << qPrintable(cmd["cmd"].toString()) << std::endl;
		if (cmd["cmd"] != "auth") {
			return false;
		}
		return true;
	}

	
	void doTask(const QJsonValue& param)
	{
		std::cout << "received auth" << std::endl;
		if (param.isObject()) {
			std::cout << qPrintable(param["xaddr"].toString()) << ", " << qPrintable(param["user"].toString()) << ", " << qPrintable(
				param["password"].toString()) << std::endl;
			QString xaddr = param["xaddr"].toString();
			QString user = param["user"].toString();
			QString password = param["password"].toString();
			SoapContext* soapContext = new SoapContext;
			soapContext->setTimeout(OnvifConst::SoapTimeout);
			soapContext->setUser(user.toLatin1());
			soapContext->setPassword(password.toLatin1());
			if (xaddr.startsWith("https", Qt::CaseInsensitive)) {
				soapContext->addSslClientContext();
			}

			OnvifAuthenticationRequest* request = new OnvifAuthenticationRequest(soapContext, xaddr);
			QObject::connect(request, &OnvifRequest::finished, [this, request, user, password](const OnvifReply& reply)
			{
				_sendOnvifRequestResult = [this, reply, user, password]()
				{
					if (reply.error() != SoapError::Ok) {
						_sender.sendResult(QJsonDocument{{"error", reply.error()}}.toJson());
					}

					auto url = reply.value(OnvifKey::Device::Url).toUrl();
					std::cout << "url: " << qPrintable(url.toString()) << std::endl;

					_sendOnvifSessionResult = [this](const QByteArray& result)	{
						QMetaObject::invokeMethod(&_sender, [this, result]()
						{
							_sender.sendResult(result);
						});						
					};
					
					_informer.reset(new OnvifServiceInformer(url, user, password, 
						_sendOnvifSessionResult, _sendOnvifSessionResult));
				};
				
				QMetaObject::invokeMethod(&_sender, _sendOnvifRequestResult);				

			});
			QObject::connect(request, &OnvifRequest::finished, soapContext, &QObject::deleteLater);
			QThreadPool::globalInstance()->start(request);
		}
	}
};

class OnvifDiscoveryClientHandler
{
	BaseHandler* _rootHandler;
	DeviceScanner _devScanner;
	ResultSender _sender;
	DiscoveryHandler _discoveryHandler;
	AuthHandler _authHandler;
	std::function<void()> _handleDone;

public:
	OnvifDiscoveryClientHandler(QLocalSocket* client, OnvifDeviceScanner& scanner) : _devScanner(scanner), _sender(client),
	                                                                                 _discoveryHandler(_devScanner, _sender), _authHandler(_sender)
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

	void setHandleDone(std::function<void()> handleDone)
	{
		_handleDone = handleDone;
	}
};
