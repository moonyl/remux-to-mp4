#pragma once
#include <basekit/Exception.h>

extern "C" {
#include <libavformat/avformat.h>
}
#include "RemuxedOutput.h"

class RemuxResourceContext
{
	AVFormatContext* _ifmtCtx = nullptr;
	AVFormatContext* _ofmtCtx = nullptr;
	int* _streamMapping = nullptr;
	RemuxedOutput _remuxedOut;

public:
	~RemuxResourceContext();

	void openInput(const char* in_filename);

	void allocOutputContext();

	void allocStreamMapping();

	void assignRemuxedOutput();

	AVFormatContext* inputFormatContext() const { return _ifmtCtx; }
	AVFormatContext* outputFormatContext() const { return _ofmtCtx; }
	RemuxedOutput& remuxedOutput() { return _remuxedOut; }
	int* streamMapping() const { return _streamMapping; }
};