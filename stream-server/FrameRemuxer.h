#pragma once

extern "C" {
#include <libavcodec/avcodec.h>
}
class RemuxResourceContext;

class FrameRemuxer
{
	double _startPts = -1;
	AVPacket _pkt;
	RemuxResourceContext& _resource;

public:
	FrameRemuxer(RemuxResourceContext& resource) : _resource(resource) {}
	void remux();
};