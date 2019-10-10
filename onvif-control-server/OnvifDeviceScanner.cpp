
#include "OnvifDeviceScanner.h"
#include <networkkit/tool/NetworkInterface.h>

QList<QPair<QHostAddress, QString>> loadNetworkInterfaces()
{
	QList<QPair<QHostAddress, QString>> result;
	QList<QNetworkInterface> ifaces = NetworkInterface::interfaces();
	for (auto iface : qAsConst(ifaces)) {
		QList<QNetworkAddressEntry> addrs = NetworkInterface::addressEntriesFromInterface(iface);
		for (auto addr : qAsConst(addrs)) {
			QString text = QString("%1 (%2)").arg(addr.ip().toString(), iface.humanReadableName());
			std::cout << qPrintable(text) << std::endl;
			result << QPair<QHostAddress, QString>(addr.ip(), iface.humanReadableName());
		}
	}

	return result;
}