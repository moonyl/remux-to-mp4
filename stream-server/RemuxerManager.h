#pragma once

#include <QMap>
#include <QSharedPointer>
//#include "RemuxScheduler.h"
#include <QUuid>
#include "RemuxingContext.h"
#include "RemuxScheduler.h"
#include "StreamSetupCommunicator.h"
#include <QUrl>
#include <algorithm>
#include <functional>
#include <QtConcurrent>
//class StreamSetupCommunicator;
class QWebSocket;

class RemuxerManager : public QMap<QUuid, QSharedPointer<RemuxingContext>>
{
	StreamSetupCommunicator& _setupCommunicator;
	RemuxScheduler _scheduler;
	QMap<QUuid, QWebSocket> _sockets;

public:
	RemuxerManager(StreamSetupCommunicator& setupCommunicator) : _setupCommunicator(setupCommunicator), _scheduler(*this)
	{
		QObject::connect(&_setupCommunicator, &StreamSetupCommunicator::created,
			[this](const QString& cameraId, const QUrl& url) {
				value(cameraId)->setUrl(qPrintable(url.toString(QUrl::None)));
			});
	}
	
	void update(const QString& cameraId, QWebSocket* socket)
	{
		if (!contains(cameraId)) {
			_setupCommunicator.makeRemuxContext(cameraId);
			const auto &remuxer = QSharedPointer<RemuxingContext>{ new RemuxingContext };
			QObject::connect(remuxer.get(), &RemuxingContext::singleStepFinished, [this]()
				{
					asynRemux();
					//monitorStream();
					cleanupEnded();
				});
			
			insert(cameraId, remuxer);			
		}
		value(cameraId)->addSocket(socket);
	}

	void asynRemux()
	{
		for (const auto& remuxer: remuxers()) {
			remuxer->asyncRemux();			
		}		
	}

	void startRemux()
	{
		_scheduler.start();
	}
	
	QList<QSharedPointer<RemuxingContext>> remuxers() const {
		return values();
	}

	void cleanupEnded()
	{
		for (const auto& key : keys()) {
			if (value(key)->isStreamEnded()) {
				remove(key);
			}
		}
	}
};
