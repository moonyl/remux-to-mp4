#pragma once

#include <QMap>
#include <QSharedPointer>
#include <QUuid>
#include "RemuxingContext.h"
//#include "RemuxScheduler.h"
#include "StreamSetupCommunicator.h"
#include <QUrl>

class QWebSocket;

class RemuxerManager : public QMap<QUuid, QSharedPointer<RemuxingContext>>
{
	StreamSetupCommunicator& _setupCommunicator;
	//RemuxScheduler _scheduler;
	QMap<QUuid, QWebSocket> _sockets;
	bool _disconnectRequested = false;

public:
	RemuxerManager(StreamSetupCommunicator& setupCommunicator) : _setupCommunicator(setupCommunicator)//, _scheduler(*this)
	{
		QObject::connect(&_setupCommunicator, &StreamSetupCommunicator::created,
			[this](const QString& cameraId, const QUrl& url) {
			std::cout << "url: " << qPrintable(url.toString(QUrl::None)) << ", valid: " << url.isValid() << std::endl;
				if (!url.isEmpty() && url.isValid()) {
					value(cameraId)->setUrl(qPrintable(url.toString(QUrl::None)));
					value(cameraId)->asyncRemux();
				}				
			});
	}
	
	void update(const QString& cameraId, QWebSocket* socket)
	{
		if (!contains(cameraId)) {
			bool valid = _setupCommunicator.makeRemuxContext(cameraId);
			if (!valid)	{
				return;
			}
			const auto &remuxer = QSharedPointer<RemuxingContext>{ new RemuxingContext };
			QObject::connect(remuxer.get(), &RemuxingContext::singleStepFinished, [this]()
				{
					asyncRemux();					
					cleanupEnded();
				});
			
			insert(cameraId, remuxer);						
		}
		value(cameraId)->addSocket(socket);
	}

	void asyncRemux()
	{
		for (const auto& remuxer: remuxers()) {
			remuxer->asyncRemux();			
		}		
	}

	void startRemux()
	{
		//_scheduler.start();
		asyncRemux();
	}
	
	QList<QSharedPointer<RemuxingContext>> remuxers() const {
		return values();
	}

	void cleanupEnded()
	{
		for (const auto& key : keys()) {
			if (value(key)->isStreamEnded()) {
				std::cout << "remove stream" << std::endl;
				remove(key);
			}
		}
	}
};
