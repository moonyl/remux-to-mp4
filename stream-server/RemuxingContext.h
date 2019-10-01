
#pragma once

#include <QSet>

extern "C" {
#include <libavcodec/avcodec.h>
}
#include "RemuxResourceContext.h"
#include "RemuxingState.h"
#include <QtConcurrent>

#include <iostream>
class QWebSocket;

class RemuxingContext : public QObject
{
	Q_OBJECT
	std::string _inFileName;
	//QWebSocket* _socket;
	QSet<QWebSocket*> _sockets;
	std::unique_ptr<RemuxResourceContext> _resource;
	std::unique_ptr<RemuxingState> _state;
	bool _ended = true;
	
	QFuture<QByteArray> _future;
	bool _tryRemuxing = false;
	QFutureWatcher<QByteArray> _futureWatcher;

	QByteArray _header;
	double _pts = 0;

public:
	RemuxingContext(QObject* parent = nullptr) : RemuxingContext("", parent) {}
	RemuxingContext(const char* in_filename, QObject* parent = nullptr);
	~RemuxingContext();

	void setUrl(const char* inFileName);

	void asyncRemux();
	bool isAsyncJobFinished() const;
	void sendResult();

	QByteArray remux();

	void addSocket(QWebSocket* socket);

	QList<QWebSocket*> sockets() const;

	bool prepared() const;

	bool isStreamEnded() const;

signals:
	void singleStepFinished();
	
private:
	// TODO : 다른 스레드에서 동작할 것이다.
	void changeState(RemuxingState* state);

	void handleStreamEnd();

	RemuxResourceContext& resource();

	void setHeader(const QByteArray& header);
	void updatePts(double pts) { _pts = pts; }

	int countOfClients() const;
	
private slots:
	void handleSocketClosed();
	
	friend class HeaderGenerate;
	friend class RemuxStream;
	friend class TrailerWrite;
	friend class Idle;
};
