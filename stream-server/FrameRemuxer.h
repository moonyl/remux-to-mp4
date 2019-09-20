#pragma once

extern "C" {
#include <libavcodec/avcodec.h>
}
#include <QByteArray>
class RemuxResourceContext;

class FrameRemuxer
{
	double _startPts = -1;
	AVPacket _pkt;
	RemuxResourceContext& _resource;
	//bool _alreadyReadFrame = false;
	int64_t _pts = -1;
public:
	FrameRemuxer(RemuxResourceContext& resource) : _resource(resource) {}
	~FrameRemuxer();
	QByteArray remux();

private:
	QByteArray doRemux();
	QByteArray doTranscode();
};