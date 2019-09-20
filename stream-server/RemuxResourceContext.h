#pragma once
#include <basekit/Exception.h>

extern "C" {
#include <libavformat/avformat.h>
#include <libswresample/swresample.h>
#include <libavutil/avutil.h>
#include <libavutil/audio_fifo.h>
}
#include "RemuxedOutput.h"

class RemuxResourceContext
{
	AVFormatContext* _ifmtCtx = nullptr;
	AVFormatContext* _ofmtCtx = nullptr;
	int* _streamMapping = nullptr;
	RemuxedOutput _remuxedOut;

	AVCodec* _inputCodec = nullptr;
	AVCodecContext* _inputCodecCtx = nullptr;
	AVCodec* _outputCodec = nullptr;
	AVCodecContext* _outputCodecCtx = nullptr;

	SwrContext* _resampleContext = nullptr;
	AVAudioFifo* _fifo = nullptr;

public:
	~RemuxResourceContext();

	void openInput(const char* in_filename);

	void allocOutputContext();

	void allocStreamMapping();

	void assignRemuxedOutput();

	bool allocTranscodingResources(AVCodecParameters* in_codecpar, AVStream* out_stream);

	void allocResampler()
	{
		_resampleContext = swr_alloc_set_opts(nullptr, 
			av_get_default_channel_layout(_outputCodecCtx->channels),
			_outputCodecCtx->sample_fmt,
			_outputCodecCtx->sample_rate,
			av_get_default_channel_layout(_inputCodecCtx->channels),
			_inputCodecCtx->sample_fmt,
			_inputCodecCtx->sample_rate,
			0, nullptr);
		if(!_resampleContext) {
			throw EXCEPTION_MESSAGE(Exception, AVERROR(ENOMEM), "Could not allocate resample context");
		}

		/*
		* Perform a sanity check so that the number of converted samples is
		* not greater than the number of samples to be converted.
		* If the sample rates differ, this case has to be handled differently
		*/
		assert(_outputCodecCtx->sample_rate == _inputCodecCtx->sample_rate);
		/* Open the resampler with the specified parameters. */
		int ret = swr_init(_resampleContext);
		if (ret < 0) {
			swr_free(&_resampleContext);
			throw EXCEPTION_MESSAGE(Exception, AVERROR(ret), "Could not open resample context");
		}
	}

	void allocAudioFifo()
	{
		_fifo = av_audio_fifo_alloc(_outputCodecCtx->sample_fmt, _outputCodecCtx->channels, 1);
		if (!_fifo) {
			throw EXCEPTION_MESSAGE(Exception, AVERROR(ENOMEM), "Could not allocate FIFO");
		}
	}

	AVFormatContext* inputFormatContext() const { return _ifmtCtx; }
	AVFormatContext* outputFormatContext() const { return _ofmtCtx; }
	RemuxedOutput& remuxedOutput() { return _remuxedOut; }
	int* streamMapping() const { return _streamMapping; }

	AVCodec* inputCodec() const {
		return _inputCodec;
	}
	AVCodecContext* inputCodecCtx() const {
		return _inputCodecCtx;
	}
	AVCodec* outputCodec() const
	{
		return _outputCodec;
	}
	AVCodecContext* outputCodecCtx() const {
		return _outputCodecCtx;
	}

	SwrContext* resampleCtx() const
	{
		return _resampleContext;
	}

	AVAudioFifo* audioFifo() const
	{
		return _fifo;
	}
};