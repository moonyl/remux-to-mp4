#pragma once

#include <QMap>
#include <QSharedPointer>
//#include "RemuxScheduler.h"
#include <QUuid>
#include "RemuxingContext.h"
#include "RemuxScheduler.h"
#include "StreamSetupCommunicator.h"

//class StreamSetupCommunicator;
class QWebSocket;

class RemuxerManager : public QMap<QUuid, QSharedPointer<RemuxingContext>>
{
	StreamSetupCommunicator& _setupCommunicator;
	RemuxScheduler _scheduler;

public:
	RemuxerManager(StreamSetupCommunicator& setupCommunicator) : _setupCommunicator(setupCommunicator), _scheduler(*this) {}

	void update(const QString& cameraId, QWebSocket* socket)
	{
		if (!contains(cameraId)) {
			_setupCommunicator.makeRemuxContext(cameraId);
			QObject::connect(&_setupCommunicator, &StreamSetupCommunicator::created,
				[this, socket](const QString& cameraId, QSharedPointer<RemuxingContext> context)
				{
					context->addSocket(socket);
					insert(cameraId, context);
				});
		}
	}

	void startRemux()
	{
		_scheduler.start();
	}
	
	QList<QSharedPointer<RemuxingContext>> remuxers() const { return values(); }

	void cleanupEnded()
	{
		for (const auto& key : keys()) {
			if (value(key)->isStreamEnded()) {
				remove(key);
			}
		}
	}
};
