#include "FrameRemuxer.h"
#include "RemuxResourceContext.h"
extern "C"	{
#include <libavcodec/avcodec.h>
#include <libswresample/swresample.h>
#include <libavutil/audio_fifo.h>
}

#include <iostream>
void remuxStream(AVFormatContext* ofmt_ctx, AVStream* in_stream, AVPacket& pkt, double& startPts)
{
	AVStream* out_stream = ofmt_ctx->streams[pkt.stream_index];


	/* copy packet */
	pkt.pts = av_rescale_q_rnd(pkt.pts, in_stream->time_base, out_stream->time_base, (AVRounding)(AV_ROUND_NEAR_INF | AV_ROUND_PASS_MINMAX));
	pkt.dts = av_rescale_q_rnd(pkt.dts, in_stream->time_base, out_stream->time_base, (AVRounding)(AV_ROUND_NEAR_INF | AV_ROUND_PASS_MINMAX));
	pkt.duration = av_rescale_q(pkt.duration, in_stream->time_base, out_stream->time_base);
	pkt.pos = -1;	

	//std::cout << "from remux check pts: " << pkt.pts << std::endl;
	
	//log_packet(ofmt_ctx, &pkt, "out");
	
	// if (startPts < 0) {
	// 	startPts = av_q2d(in_stream->time_base) * pkt.pts;
	// 	std::cout << "startPts = " << startPts << std::endl;
	// }
	// if (av_q2d(in_stream->time_base) * pkt.pts - startPts > 20.0) {
	// 	av_packet_unref(&pkt);
	// 	throw EXCEPTION_MESSAGE(Exception, 0, "test finished");
	// }
}

QByteArray writeStream(AVFormatContext* ofmt_ctx, RemuxedOutput& remuxedOut, AVPacket& pkt)
{
	int ret = av_interleaved_write_frame(ofmt_ctx, &pkt);
	if (ret < 0) {
		throw EXCEPTION_MESSAGE(Exception, ret, "Error muxing packet");
	}

	av_packet_unref(&pkt);

	return remuxedOut.update();
}

bool updatePacketForRemuxing(int streamMappingSize, int* streamMapping, AVPacket& pkt)
{	
	if (pkt.stream_index >= streamMappingSize ||
		streamMapping[pkt.stream_index] < 0) {
		av_packet_unref(&pkt);
		return false;
	}
	pkt.stream_index = streamMapping[pkt.stream_index];
	return true;
}

void convert_samples(const uint8_t** input_data,
	uint8_t** converted_data, const int frame_size,
	SwrContext* resample_context)
{
	int ret;
	/* Convert the samples using the resampler. */
	if ((ret = swr_convert(resample_context,
		converted_data, frame_size,
		input_data, frame_size)) < 0) {
		throw EXCEPTION_MESSAGE(Exception, AVERROR(ret), "Could not convert input samples");
	}
}

/**
 * Add converted input audio samples to the FIFO buffer for later processing.
 * @param fifo                    Buffer to add the samples to
 * @param converted_input_samples Samples to be added. The dimensions are channel
 *                                (for multi-channel audio), sample.
 * @param frame_size              Number of samples to be converted
 * @return Error code (0 if successful)
 */
void add_samples_to_fifo(AVAudioFifo* fifo,
	uint8_t** converted_input_samples,
	const int frame_size)
{
	int ret;
	/* Make the FIFO as large as it needs to be to hold both,
	 * the old and the new samples. */
	ret = av_audio_fifo_realloc(fifo, av_audio_fifo_size(fifo) + frame_size);
	if (ret < 0) {
		throw EXCEPTION_MESSAGE(Exception, AVERROR(ret), "Could not reallocate FIFO");
	}
	/* Store the new samples in the FIFO buffer. */
	if (av_audio_fifo_write(fifo, (void**)converted_input_samples,
		frame_size) < frame_size) {
		throw EXCEPTION_MESSAGE(Exception, AVERROR_EXIT, "Could not reallocate FIFO");
	}
}

QMutex FrameRemuxer::frameWriteMutex;

QByteArray FrameRemuxer::doRemux()
{
	AVFormatContext* ifmtCtx = _resource.inputFormatContext();
	AVFormatContext* ofmtCtx = _resource.outputFormatContext();
	int* streamMapping = _resource.streamMapping();
	RemuxedOutput& remuxedOut = _resource.remuxedOutput();
	AVStream* in_stream = ifmtCtx->streams[_pkt.stream_index];
	
	if (!updatePacketForRemuxing(ifmtCtx->nb_streams, streamMapping, _pkt)) {
		return QByteArray();
	}
	remuxStream(ofmtCtx, in_stream, _pkt, _startPts);
	if (_pts == -1) {
		_pts = _pkt.pts;
	}

	//{
		//QMutexLocker locker(&frameWriteMutex);
		return writeStream(ofmtCtx, remuxedOut, _pkt);
	//}
}

class DecodingJob
{
	AVFrame* _inputFrame;
	AVCodecContext* _iCodecCtx;
	int _streamIndex;
	
public:
	DecodingJob(AVCodecContext* iCodecCtx) : _iCodecCtx(iCodecCtx), _streamIndex(-1)
	{
		_inputFrame = av_frame_alloc();
		if (!_inputFrame) {
			throw EXCEPTION_MESSAGE(Exception, AVERROR(ENOMEM), "Could not allocate input frame");
		}
	}
	~DecodingJob()
	{
		if (_inputFrame) {
			av_frame_free(&_inputFrame);
		}
	}
	
	void execute(AVPacket& pkt) {
		int ret = avcodec_send_packet(_iCodecCtx, &pkt);
		if (ret < 0) {
			throw EXCEPTION_MESSAGE(Exception, ret, "av_read_frame error");
		}

		ret = avcodec_receive_frame(_iCodecCtx, _inputFrame);
		if (ret < 0) {
			if (ret == AVERROR_EOF) {
				throw EXCEPTION_MESSAGE(Exception, 0, "arrived at end of file");
			}
			throw EXCEPTION_MESSAGE(Exception, AVERROR(ret), "Could not decode frame");
		}
		_streamIndex = pkt.stream_index;
	}

	int streamIndex() const { return _streamIndex; }
	AVFrame* decoded() const {
		return _inputFrame;
	}
};

class ResamplingJob
{
	uint8_t** converted_input_samples = nullptr;	
	SwrContext* _resampleCtx;
	
public:
	ResamplingJob(SwrContext* resampleCtx) :_resampleCtx(resampleCtx) {}
	~ResamplingJob() {
		if (converted_input_samples) {
			av_freep(&(converted_input_samples[0]));
			free(converted_input_samples);
		}
	}
	void execute(AVFrame* inputFrame, int outputChannels, AVSampleFormat outputSampleFormat)
	{
		converted_input_samples = static_cast<uint8_t * *>(calloc(outputChannels, sizeof(converted_input_samples)));
		if (!converted_input_samples) {
			throw EXCEPTION_MESSAGE(Exception, AVERROR(ENOMEM), "Could not allocate converted input sample pointers");
		}

		int ret = av_samples_alloc(converted_input_samples, nullptr, outputChannels, inputFrame->nb_samples, outputSampleFormat, 0);
		if (ret < 0) {
			throw EXCEPTION_MESSAGE(Exception, AVERROR(ret), "Could not allocate converted input samples");
		}

		convert_samples(const_cast<const uint8_t * *>(inputFrame->extended_data), converted_input_samples, inputFrame->nb_samples, _resampleCtx);
	}

	uint8_t** converted() const {
		return converted_input_samples;
	}
};

class EncodingJob
{
	AVPacket _outputPacket;
	AVCodecContext* _outputCodecCtx;
	
public:
	EncodingJob(AVCodecContext* outputCodecCtx) : _outputCodecCtx(outputCodecCtx) {}
	~EncodingJob() { av_packet_unref(&_outputPacket); }
	bool execute(AVFrame* outputFrame, int64_t pts, int streamIndex)
	{		
		av_init_packet(&_outputPacket);
		_outputPacket.data = nullptr;
		_outputPacket.size = 0;

		// NOTE : 예제와 다른 부분이다. 0으로 초기화해야 하는건가?
		//AVFormatContext* ofmtCtx = _resource.outputFormatContext();
		//AVStream* out_stream_temp = ofmtCtx->streams[decodingJob.streamIndex()];
		//std::cout << "audio compensate : " << av_q2d(out_stream_temp->time_base) * _pts << ", pts: " << _pts << std::endl;
		outputFrame->pts = pts;
		//_pts += outputFrame->nb_samples;
		int ret = avcodec_send_frame(_outputCodecCtx, outputFrame);
		if (ret < 0) {			
			if (ret == AVERROR_EOF) {
				throw EXCEPTION_MESSAGE(Exception, AVERROR_EOF, "Could not send packet for encoding");
			}
			throw EXCEPTION_MESSAGE(Exception, AVERROR(ret), "Could not send packet for encoding");
		}

		ret = avcodec_receive_packet(_outputCodecCtx, &_outputPacket);
		if (ret < 0) {			
			if (ret == AVERROR(EAGAIN) || ret == AVERROR_EOF) {
				return false;
			}
			throw EXCEPTION_MESSAGE(Exception, AVERROR(ret), "Could not encode frame");
		}
		_outputPacket.stream_index = streamIndex;

		return true;
	}
	
	const AVPacket& outputPacket() const {
		return _outputPacket;
	}
};

class OutputFrameBuffer
{
	AVFrame* _outputFrame = nullptr;
	AVCodecContext* _outCodecCtx;
	
public:
	OutputFrameBuffer(AVCodecContext* outCodecCtx) : _outCodecCtx(outCodecCtx)
	{
		_outputFrame = av_frame_alloc();
		if (!_outputFrame) {
			throw EXCEPTION_MESSAGE(Exception, AVERROR_EXIT, "Could not allocate output frame");
		}
	}
	~OutputFrameBuffer()
	{
		if (_outputFrame) {
			av_frame_free(&_outputFrame);
		}
	}
	
	void getBuffer(const int frameSize)
	{

		/* Set the frame's parameters, especially its size and format.
		 * av_frame_get_buffer needs this to allocate memory for the
		 * audio samples of the frame.
		 * Default channel layouts based on the number of channels
		 * are assumed for simplicity. */
		_outputFrame->nb_samples = frameSize;
		_outputFrame->channel_layout = _outCodecCtx->channel_layout;
		_outputFrame->format = _outCodecCtx->sample_fmt;
		_outputFrame->sample_rate = _outCodecCtx->sample_rate;


		/* Allocate the samples of the created frame. This call will make
		 * sure that the audio frame can hold as many samples as specified. */
		int ret = av_frame_get_buffer(_outputFrame, 0);
		if (ret < 0) {			
			throw EXCEPTION_MESSAGE(Exception, AVERROR(ret), "Could not allocate output frame samples");
		}
	}

	AVFrame* frame() const {
		return _outputFrame;
	}
};

QByteArray FrameRemuxer::doTranscode()
{
	AVFormatContext* ifmtCtx = _resource.inputFormatContext();
	
	int ret = 0;
	//int streamIndex = -1;
	//do {

	DecodingJob decodingJob(_resource.inputCodecCtx());
	decodingJob.execute(_pkt);
	
	AVStream* in_stream = ifmtCtx->streams[_pkt.stream_index];
	AVFormatContext* ofmtCtx = _resource.outputFormatContext();
	AVStream* out_stream = ofmtCtx->streams[_pkt.stream_index];	

	_pts = av_rescale_q_rnd(_pkt.pts, in_stream->time_base, out_stream->time_base, (AVRounding)(AV_ROUND_NEAR_INF | AV_ROUND_PASS_MINMAX));

	// streamIndex = _pkt.stream_index;
		// //std::cout << "backend check pts: " << _pts << std::endl;
	av_packet_unref(&_pkt);

	ResamplingJob resamplingJob(_resource.resampleCtx());
	resamplingJob.execute(decodingJob.decoded(), _resource.outputCodecCtx()->channels, _resource.outputCodecCtx()->sample_fmt);
	
	add_samples_to_fifo(_resource.audioFifo(), resamplingJob.converted(), decodingJob.decoded()->nb_samples);

	if (av_audio_fifo_size(_resource.audioFifo()) < _resource.outputCodecCtx()->frame_size) {
		//std::cout << "fifo size: " << av_audio_fifo_size(_resource.audioFifo()) << ", frame_size: " << _resource.outputCodecCtx()->frame_size << std::endl;
		return QByteArray();
	}

	/* Use the maximum number of possible samples per frame.
	 * If there is less than the maximum possible frame size in the FIFO
	 * buffer use this number. Otherwise, use the maximum possible frame size. */
	const int frame_size = FFMIN(av_audio_fifo_size(_resource.audioFifo()), _resource.outputCodecCtx()->frame_size);
	//const int frame_size = av_audio_fifo_size(_resource.audioFifo());
	//std::cout << "size: " << av_audio_fifo_size(_resource.audioFifo()) << std::endl;
	
	OutputFrameBuffer outputFrame(_resource.outputCodecCtx());
	outputFrame.getBuffer(frame_size);

	/* Read as many samples from the FIFO buffer as required to fill the frame.
	 * The samples are stored in the frame temporarily. */
	if (av_audio_fifo_read(_resource.audioFifo(), reinterpret_cast<void**>(outputFrame.frame()->data), frame_size) < frame_size) {		
		throw EXCEPTION_MESSAGE(Exception, AVERROR_EXIT, "Could not read data from FIFO");
	}

	EncodingJob encodingJob(_resource.outputCodecCtx());
	bool finished = encodingJob.execute(outputFrame.frame(), _pts, decodingJob.streamIndex());
	if (!finished) {
		return QByteArray();
	}

	ret = av_interleaved_write_frame(_resource.outputFormatContext(), &const_cast<AVPacket&>(encodingJob.outputPacket()));

	if (ret < 0) {
		throw EXCEPTION_MESSAGE(Exception, AVERROR(ret), "Could not write frame");
	}

	return _resource.remuxedOutput().update();
}

FrameRemuxer::~FrameRemuxer()
{
	std::cout << "check, " << __FUNCTION__ << std::endl;
	av_packet_unref(&_pkt);
}


//QMutex FrameRemuxer::frameReadMutex;

//#include <QElapsedTimer>
FrameRemuxer::RemuxedFrame FrameRemuxer::remux()
{
	//QElapsedTimer elapsedTimer;
	//elapsedTimer.start();
	AVFormatContext* ifmtCtx = _resource.inputFormatContext();

	//{
		//QMutexLocker locker(&frameReadMutex);
		int ret = av_read_frame(ifmtCtx, &_pkt);
		if (ret < 0) {
			throw EXCEPTION_MESSAGE(Exception, ret, "av_read_frame error");
		}
	//}

	//std::cout << "after read: " << elapsedTimer.elapsed() << std::endl;
	
	AVStream* in_stream = ifmtCtx->streams[_pkt.stream_index];
	if (in_stream->codecpar->codec_type != AVMEDIA_TYPE_AUDIO &&
		in_stream->codecpar->codec_type != AVMEDIA_TYPE_VIDEO &&
		in_stream->codecpar->codec_type != AVMEDIA_TYPE_SUBTITLE) {
		std::cout << "cannot mux, maybe camera event?" << std::endl;
		av_packet_unref(&_pkt);
		return { QByteArray(), -1 };
	}

#if 1
	QByteArray result;
	AVFormatContext* ofmtCtx = _resource.outputFormatContext();
	AVStream* out_stream = ofmtCtx->streams[_pkt.stream_index];
	int64_t pts = av_rescale_q_rnd(_pkt.pts, in_stream->time_base, out_stream->time_base, (AVRounding)(AV_ROUND_NEAR_INF | AV_ROUND_PASS_MINMAX));
	//std::cout << "global pts : " << pts << ", in-timebase: " << in_stream->time_base.den << ", out-timebase: " << out_stream->time_base.den << std::endl;
	//std::cout << "global compensate : " << av_q2d(out_stream->time_base) * pts << ", pts: " << pts << std::endl;
	// remux case
	if (in_stream->codecpar->codec_type != AVMEDIA_TYPE_AUDIO ||
		(in_stream->codecpar->codec_type == AVMEDIA_TYPE_AUDIO && !_resource.outputCodecCtx())) {
		result = doRemux();
		
		//std::cout << "case remux: " << elapsedTimer.elapsed() << std::endl;
	} else {
		result = doTranscode();
		
		//std::cout << "case transcode: " << elapsedTimer.elapsed() << std::endl;
	}
#else
	QByteArray result;
	if (_startPts < 0) {
		_startPts = av_q2d(in_stream->time_base) * _pkt.pts;
		std::cout << "startPts = " << _startPts << std::endl;
	}
	if (av_q2d(in_stream->time_base) * _pkt.pts - _startPts > 20.0) {
		av_packet_unref(&_pkt);
		throw EXCEPTION_MESSAGE(Exception, 0, "test finished");
	}
#endif	
		
	//std::cout << "pts: " << av_q2d(in_stream->time_base) * pts << std::endl;
	av_packet_unref(&_pkt);
	return { result, av_q2d(in_stream->time_base) * pts };
}
