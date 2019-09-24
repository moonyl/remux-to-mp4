#pragma once

#include <QTimer>
#include <QFutureWatcher>
#include <QMap>

class RemuxerManager;
class QWebSocket;

class RemuxScheduler
{
	//QTimer _timer;
	RemuxerManager& _manager;
	//QFutureWatcher<QPair<QList<QWebSocket*>, QByteArray>> _remuxingFuture;
	QMap<QUuid, bool> _remuxAvailables;
public:
	RemuxScheduler(RemuxerManager& manager);

	void start();

private:
	void doRemuxing();
};