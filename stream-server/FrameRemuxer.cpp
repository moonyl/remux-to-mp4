#include "FrameRemuxer.h"
#include "RemuxResourceContext.h"
#include "remuxStreamToMP4.h"

void FrameRemuxer::remux()
{
	AVFormatContext* ifmtCtx = _resource.inputFormatContext();
	AVFormatContext* ofmtCtx = _resource.outputFormatContext();
	RemuxedOutput& remuxedOut = _resource.remuxedOutput();
	int* streamMapping = _resource.streamMapping();

	AVStream* in_stream = nullptr;
	if (remuxToMp4::readStream(ifmtCtx, streamMapping, _pkt, in_stream) != 0) {
		return;
	}

	remuxToMp4::remuxStream(ofmtCtx, in_stream, _pkt, _startPts);	

	remuxToMp4::writeStream(ofmtCtx, remuxedOut, _pkt);
}
