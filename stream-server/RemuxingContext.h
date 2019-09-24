
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
		// �̸��� �Ҵ���� �ʰ� ��Ʈ���� �����ٰ� �Ǵ��ϸ�, �ʱ�����̴�.
		return _ended && (!_inFileName.empty());
	}

	// ������ ���� �����忡�� ó���Ǿ�� �Ѵ�.
	void monitorStream()
	{
		if (isStreamEnded()) {
			for (auto socket : _sockets.toList()) {
				socket->close();
			}
		}
	}

private:
	// TODO : �ٸ� �����忡�� ������ ���̴�.
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
