
#pragma once

extern "C" {
#include <libavformat/avformat.h>
}

#include "RemuxedOutput.h"

struct RemuxIntermediate
{
	AVFormatContext* ifmt_ctx = nullptr;
	AVFormatContext* ofmt_ctx = nullptr;
	RemuxedOutput remuxedOut;
	int* stream_mapping = nullptr;
	AVOutputFormat* ofmt = nullptr;
	double startPts = -1;
};