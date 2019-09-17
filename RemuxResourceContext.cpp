
#include "RemuxResourceContext.h"

#include <iostream>
RemuxResourceContext::~RemuxResourceContext()
{
	avformat_close_input(&_ifmtCtx);
	/* close output */
	AVOutputFormat* ofmt = _ofmtCtx->oformat;
	if (_ofmtCtx && !(ofmt->flags & AVFMT_NOFILE)) {
		_remuxedOut.close();
	}

	avformat_free_context(_ofmtCtx);
	av_freep(&_streamMapping);
	std::cout << "check, " << __FUNCTION__ << std::endl;
}

void RemuxResourceContext::openInput(const char* in_filename)
{
	AVDictionary* inOptions = NULL;
	int ret = av_dict_set(&inOptions, "rtsp_transport", "tcp", 0);
	if (ret  < 0) {
		throw EXCEPTION_MESSAGE(Exception, ret, "Error on setting the option of rtsp_transport");
	}
	//ret = av_dict_set(&options, "allowed_media_types", "video", 0);
	//ret = av_dict_set(&inOptions, "avioflags", "direct", 0);
	ret = av_dict_set(&inOptions, "fflags", "nobuffer", 0);
	if (ret < 0) {
		throw EXCEPTION_MESSAGE(Exception, ret, "Error on setting the option of fflags");
	}
	//ret = av_dict_set(&inOptions, "max_delay", "100000", 0);
	//ret = av_dict_set(&inOptions, "fflags", "autobsf", 0);
	ret = av_dict_set(&inOptions, "flags", "low_delay", 0);
	if (ret < 0) {
		throw EXCEPTION_MESSAGE(Exception, ret, "Error on setting the option of flags");
	}
	
	if ((ret = avformat_open_input(&_ifmtCtx, in_filename, nullptr, &inOptions)) < 0) {
		throw EXCEPTION_MESSAGE(Exception, ret, "Could not open input file");
	}
	av_dict_free(&inOptions);
}

void RemuxResourceContext::allocOutputContext()
{
	int ret = avformat_alloc_output_context2(&_ofmtCtx, NULL, "mp4", nullptr);
	if (!_ofmtCtx) {
		throw EXCEPTION_MESSAGE(Exception, ret, "Could not create output context");
	}
}

void RemuxResourceContext::allocStreamMapping()
{
	int stream_mapping_size = _ifmtCtx->nb_streams;
	_streamMapping = static_cast<int*>(av_mallocz_array(stream_mapping_size, sizeof(*_streamMapping)));
	if (!_streamMapping) {
		throw EXCEPTION_MESSAGE(Exception, 0, "Failed stream mapping");
	}
}

void RemuxResourceContext::assignRemuxedOutput()
{
	_remuxedOut.setPb(&_ofmtCtx->pb);
}
