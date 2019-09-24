
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

class RemuxingContext
{
	std::string _inFileName;
	//QWebSocket* _socket;
	QSet<QWebSocket*> _sockets;
	std::unique_ptr<RemuxResourceContext> _resource;
	std::unique_ptr<RemuxingState> _state;
	bool _ended = true;
	QFuture<QByteArray> _future;
	bool _tryRemuxing = false;

public:
	RemuxingContext() : RemuxingContext("") {}
	RemuxingContext(const char* in_filename) : _inFileName(in_filename), _state(new Idle), _resource(new RemuxResourceContext) {}
	~RemuxingContext()
	{
		std::cout << "check, " << __FUNCTION__ << std::endl;
	}

	void setUrl(const char* inFileName)
	{
		_inFileName = inFileName;
		_ended = false;
	}

	void asyncRemux();
	bool isAsyncJobFinished() const { return _future.isFinished(); }
	void sendResult()
	{
		auto result = _future.result();
		_tryRemuxing = false;
		if(result.isEmpty()) {
			return;
		}
		for (auto socket : sockets()) {
			socket->sendBinaryMessage(result);
		}		
	}

	QByteArray remux()
	{		
		return _state->remux(this);
	}

	void addSocket(QWebSocket* socket)
	{
		QObject::connect(socket, &QWebSocket::disconnected, [this, socket]()
			{
				_sockets.remove(socket);
			});

		_sockets << socket;
	}

	QList<QWebSocket*> sockets() const
	{
		return _sockets.toList();
	}

	bool prepared() const
	{
		return (!_ended) && (!_inFileName.empty());
	}
	
	bool isStreamEnded() const
	{
		// 이름도 할당되지 않고 스트림이 끝났다고 판단하면, 초기상태이다.
		return _ended && (!_inFileName.empty());
	}

	// 소켓은 메인 스레드에서 처리되어야 한다.
	void monitorStream()
	{
		if (isStreamEnded()) {
			for (auto socket : _sockets.toList()) {
				socket->close();
			}
		}
	}

private:
	// TODO : 다른 스레드에서 동작할 것이다.
	void changeState(RemuxingState* state)
	{
		_state.reset(state);
	}

	void handleStreamEnd()
	{
		_ended = true;
	}	
	
	RemuxResourceContext& resource() { return *_resource; }	
	
	friend class HeaderGenerate;
	friend class RemuxStream;
	friend class TrailerWrite;
	friend class Idle;
};
