#include "onvifHandlers.h"
#include <onvifkit/service/device/OnvifAuthenticationRequest.h>

void BaseHandler::handle(const QJsonDocument& cmd)
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
void BaseHandler::addHandler(BaseHandler* handler)
{
	if (!_next) {
		_next = handler;
		return;
	}
	_next->addHandler(handler);
}
DeviceScanner::DeviceScanner(OnvifDeviceScanner& scanner): _scanner(scanner) {}
void DeviceScanner::scanDevices(const QUuid sessionId, const QList<QHostAddress>& addrs, std::function<void(const QByteArray&)> handleFound)
{
	QObject::connect(&_scanner, &OnvifDeviceScanner::deviceFound, handleFound);
	_scanner.scan(sessionId, addrs);
}
ResultSender::ResultSender(QLocalSocket* client, QObject* parent): QObject(parent), _client(client)
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
ResultSender::~ResultSender()
{
	_client->deleteLater();
}
void ResultSender::setReplyHandle(std::function<void(const QJsonDocument& jsonResult)> handleReply)
{
	_handleReply = handleReply;
}
void ResultSender::sendResult(const QByteArray& jsonResult)
{
	_client->write(jsonResult);
}
bool DiscoveryHandler::match(const QJsonDocument& cmd)
{
	if (!cmd.isObject()) {
		return false;
	}

	if (cmd["cmd"] != "discovery") {
		return false;
	}
	return true;
}

void DiscoveryHandler::doTask(const QJsonValue& param)
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

QList<OnvifMediaProfile> mediaProfilesFromOnvifSession(const OnvifSession& session)
{
	auto mediaServiceMap = session.values(OnvifServiceCategory::Media);
	int count = mediaServiceMap.value(OnvifKey::Media::ProfileCount).toInt();
	QList<OnvifMediaProfile> profileList;
	for (int i = 0; i < count; ++i) {
		profileList << mediaServiceMap.value(MK_KEY(OnvifKey::Media::iProfile, i)).value<OnvifMediaProfile>();
	}
	return profileList;
}

QJsonArray makeMediaProfilesToJson(const QList<OnvifMediaProfile>& profileList)
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
OnvifServiceInformer::OnvifServiceInformer(const QUrl& url, const QString& user, const QString& password, std::function<void(const QByteArray&)> onOk,
	std::function<void(const QByteArray&)> onError): _session(new OnvifSession), _onOk(onOk), _onError(onError)
{
	QObject::connect(_session.data(), &OnvifSession::sessionReady, [this](qint64 handle)
	{
		QJsonObject result{{"state", true}};
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
		QJsonObject result{{"state", false}, {"error", errText}};
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

bool AuthHandler::match(const QJsonDocument& cmd)
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

void AuthHandler::doTask(const QJsonValue& param)
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
					_sender.sendResult(QJsonDocument{QJsonObject{{"state", false}, {"error", reply.errorText()}}}.toJson());
					return;
				}

				auto url = reply.value(OnvifKey::Device::Url).toUrl();
				std::cout << "url: " << qPrintable(url.toString()) << std::endl;

				_sendOnvifSessionResult = [this](const QByteArray& result)
				{
					QMetaObject::invokeMethod(&_sender, [this, result]()
					{
						_sender.sendResult(result);
					});
				};

				std::cout << "check: informer reset" << std::endl;
				_informer.reset(new OnvifServiceInformer(url, user, password,
					_sendOnvifSessionResult, _sendOnvifSessionResult));
			};

			QMetaObject::invokeMethod(&_sender, _sendOnvifRequestResult);
		});
		QObject::connect(request, &OnvifRequest::finished, soapContext, &QObject::deleteLater);
		QThreadPool::globalInstance()->start(request);
	}
}
