#pragma once
#include <basekit/Exception.h>

extern "C"	{
#include <libavformat/avformat.h>
}

class QWebSocket;
class RemuxResourceContext;

class HeaderGenerater
{
	RemuxResourceContext& _resource;
	AVOutputFormat* _ofmt = nullptr;

public:
	HeaderGenerater(RemuxResourceContext& resource) : _resource(resource) {}

	void makeHeader(const char* in_filename, QWebSocket* socket);
};