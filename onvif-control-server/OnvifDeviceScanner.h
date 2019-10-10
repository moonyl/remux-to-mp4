
#pragma once

#include <onvifkit/OnvifDiscovery.h>
#include <iostream>

class OnvifDeviceScanner : public QObject
{
	Q_OBJECT
	
	QQueue<QUuid> _requestIds;
public:
	void scan(const QUuid& requestId, const QList<QHostAddress>& addrs = QList<QHostAddress>())
	{
		//std::cout << "requestId: " << qPrintable(requestId.toString()) << std::endl;
		QVariant test(requestId);
		auto doc = QJsonValue::fromVariant(QVariant(requestId));
		//std::cout << "without braces: " << qPrintable(requestId.toString(QUuid::WithoutBraces)) << std::endl;
		//std::cout << "variant requestId: " << qPrintable(doc.toString()) << std::endl;
		_requestIds.enqueue(requestId);
		OnvifDiscovery* discovery = new OnvifDiscovery;
		//QObject::connect(discovery, &OnvifDiscovery::finished, this, &MainWindow::handleOnvifDiscoveryFinished);
		connect(discovery, &OnvifDiscovery::finished, [this](const OnvifDeviceList& devInfo)
			{
				QJsonArray jsonAddrs;
				for (const auto& item : devInfo) {
					if (item.xaddrs().empty()) {
						jsonAddrs << QJsonObject({ { "ip", item.ip() }, {"model", item.modelName()}, {"xaddr", "" } });
					}
					else {
						jsonAddrs << QJsonObject({ { "ip", item.ip() }, {"model", item.modelName()}, {"xaddr", item.xaddrs()[0]} });
					}

					//std::cout << qPrintable(item.ip()) << ", " << qPrintable(item.xaddrs()[0]) << ", " << qPrintable(item.modelName()) << std::endl;	
				}
				auto replyId = QJsonValue::fromVariant(QVariant(_requestIds.dequeue()));
				QJsonObject result{ {"devices", jsonAddrs} };
			
				auto jsonResult = QJsonDocument(QJsonObject{ {"state", true}, {"session", replyId}, {"result", result} }).toJson();
				//auto jsonResult = QJsonDocument(QJsonObject{{"session", replyId}}).toJson();
				//std::cout << qPrintable(jsonResult) << std::endl;								
				emit deviceFound(jsonResult);
			});

		connect(discovery, &OnvifDiscovery::finished, discovery, &QObject::deleteLater);

		//QList<QHostAddress> addrs({ QHostAddress(_ui.networkInterfaceCombo->currentData().toString()) });
		discovery->start(addrs, 5000, 2);
	}
signals:
	void deviceFound(const QByteArray& jsonByteArray);
};

QList<QPair<QHostAddress, QString>> loadNetworkInterfaces();