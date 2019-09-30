#pragma once

extern "C" {
#include <libavcodec/avcodec.h>
}
#include <QByteArray>
#include <QMutex>

class RemuxResourceContext;

class FrameRemuxer
{
	double _startPts = -1;
	AVPacket _pkt;
	RemuxResourceContext& _resource;
	//bool _alreadyReadFrame = false;
	int64_t _pts = -1;
	static QMutex frameReadMutex;
	static QMutex frameWriteMutex;
	
public:
	FrameRemuxer(RemuxResourceContext& resource) : _resource(resource) {}
	~FrameRemuxer();
	struct RemuxedFrame
	{
		QByteArray frame;
		double pts;
	};
	RemuxedFrame remux();

private:
	QByteArray doRemux();
	QByteArray doTranscode();
};