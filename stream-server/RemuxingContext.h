
#pragma once

#include <QSet>

extern "C" {
#include <libavcodec/avcodec.h>
}
#include "RemuxResourceContext.h"
#include "RemuxingState.h"

class QWebSocket;

class RemuxingContext
{
	std::string _inFileName;
	QWebSocket* _socket;
	std::unique_ptr<RemuxResourceContext> _resource;
	std::unique_ptr<RemuxingState> _state;

public:
	RemuxingContext(const char* in_filename) : _inFileName(in_filename), _state(new HeaderGenerate), _resource(new RemuxResourceContext) {}

	void restart()
	{
		_resource.reset(new RemuxResourceContext);
		_state.reset(new HeaderGenerate);		
	}
	
	bool remux()
	{
		return _state->remux(this);
	}

	void addSocket(QWebSocket* socket)
	{
		//_sockets << socket;
		_socket = socket;
	}

private:
	void changeState(RemuxingState* state)
	{
		_state.reset(state);
	}
	
	RemuxResourceContext& resource() { return *_resource; }	
	
	friend class HeaderGenerate;
	friend class RemuxStream;
	friend class TrailerWrite;
	friend class ResourceRelease;
};
