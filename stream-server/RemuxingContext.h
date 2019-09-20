
#pragma once

#include <QSet>

extern "C" {
#include <libavcodec/avcodec.h>
}
#include "RemuxResourceContext.h"
#include "RemuxingState.h"

#include <iostream>
class QWebSocket;

class RemuxingContext
{
	std::string _inFileName;
	QWebSocket* _socket;
	std::unique_ptr<RemuxResourceContext> _resource;
	std::unique_ptr<RemuxingState> _state;
	bool _ended = false;

public:
	RemuxingContext(const char* in_filename) : _inFileName(in_filename), _state(new HeaderGenerate), _resource(new RemuxResourceContext) {}
	~RemuxingContext()
	{
		std::cout << "check, " << __FUNCTION__ << std::endl;
	}

	void restart()
	{
		_resource.reset(new RemuxResourceContext);
		_state.reset(new HeaderGenerate);		
	}
	
	QByteArray remux()
	{		
		return _state->remux(this);
	}

	void addSocket(QWebSocket* socket)
	{
		//_sockets << socket;
		_socket = socket;
	}

	void sendRemuxed(const QByteArray &remuxed)
	{
		if (!remuxed.isEmpty()) {
			_socket->sendBinaryMessage(remuxed);
		}		
	}

	bool isStreamEnded() const
	{
		return _ended;
	}

private:
	void changeState(RemuxingState* state)
	{
		_state.reset(state);
	}

	void handleStreamEnd()
	{
		_ended = true;
		_socket->close();
	}
	
	RemuxResourceContext& resource() { return *_resource; }	
	
	friend class HeaderGenerate;
	friend class RemuxStream;
	friend class TrailerWrite;	
};
