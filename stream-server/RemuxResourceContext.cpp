
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

	if (_fifo) {
		av_audio_fifo_free(_fifo);
	}
	
	if (_resampleContext) {
		swr_free(&_resampleContext);
	}
	
	if (_outputCodecCtx) {
		avcodec_free_context(&_outputCodecCtx);
	}
	if (_inputCodecCtx) {
		avcodec_free_context(&_inputCodecCtx);
	}
}

void RemuxResourceContext::openInput(const char* in_filename)
{
	AVDictionary* inOptions = NULL;
	int ret = av_dict_set(&inOptions, "rtsp_transport", "tcp", 0);
	if (ret  < 0) {
		throw EXCEPTION_MESSAGE(Exception, ret, "Error on setting the option of rtsp_transport");
	}
	
	// ret = av_dict_set(&inOptions, "allowed_media_types", "video", 0);
	// if (ret < 0) {
	// 	throw EXCEPTION_MESSAGE(Exception, ret, "Error on setting the option of allowed_media_types");
	// }
	
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

class TranscodeNeedDetect
{
	bool _need;
	AVCodecParameters* _codecPar;
public:
	TranscodeNeedDetect(AVCodecParameters* in_codecpar) : _need(false), _codecPar(in_codecpar)
	{
		if (_codecPar->codec_type == AVMEDIA_TYPE_AUDIO && _codecPar->codec_id != AV_CODEC_ID_AAC) {
			_need = true;
		}
	}

	bool isNecessary() const { return _need; }
	AVCodecID codedId() const
	{
		if (!_need) {
			return AV_CODEC_ID_NONE;
		}
		return _codecPar->codec_id;
	}

	int channels() const { return _codecPar->channels; }
	uint64_t channelLayout() const { return _codecPar->channel_layout; }
	int sampleRate() const { return _codecPar->sample_rate; }
	int64_t bitRate() const { return _codecPar->bit_rate; }
};

bool RemuxResourceContext::allocTranscodingResources(AVCodecParameters* in_codecpar, AVStream* out_stream)
{
	TranscodeNeedDetect detector(in_codecpar);
	if (!detector.isNecessary()) {
		return false;
	}

	_inputCodec = avcodec_find_decoder(detector.codedId());
	if (!_inputCodec) {
		throw EXCEPTION_MESSAGE(Exception, 0, "Failed on avcodec_find_decoder");
	}
	_inputCodecCtx = avcodec_alloc_context3(_inputCodec);
	if (!_inputCodecCtx) {
		throw EXCEPTION_MESSAGE(Exception, 0, "Failed on avcodec_alloc_context3");
	}
	int ret = avcodec_parameters_to_context(_inputCodecCtx, in_codecpar);
	if (ret < 0) {
		avcodec_free_context(&_inputCodecCtx);
		throw EXCEPTION_MESSAGE(Exception, ret, "Failed on avcodec_alloc_context3");
	}
	ret = avcodec_open2(_inputCodecCtx, _inputCodec, nullptr);
	if (ret < 0) {
		avcodec_free_context(&_inputCodecCtx);
		throw EXCEPTION_MESSAGE(Exception, ret, "Failed on avcodec_alloc_context3");
	}
	
	_outputCodec = avcodec_find_encoder(AV_CODEC_ID_AAC);
	if (!_outputCodec) {
		throw EXCEPTION_MESSAGE(Exception, 0, "Failed on avcodec_find_decoder for output");
	}
	_outputCodecCtx = avcodec_alloc_context3(_outputCodec);
	if (!_outputCodecCtx) {
		throw EXCEPTION_MESSAGE(Exception, 0, "Failed on avcodec_alloc_context3 for output");
	}
	_outputCodecCtx->channels = detector.channels(); //2; //detector.channels();
	_outputCodecCtx->channel_layout = av_get_default_channel_layout(_outputCodecCtx->channels);//detector.channelLayout();
	_outputCodecCtx->sample_rate = detector.sampleRate();
	_outputCodecCtx->sample_fmt = _outputCodec->sample_fmts[0];
	_outputCodecCtx->bit_rate = 96000;//detector.bitRate();

	/* Allow the use of the experimental AAC encoder. */
	_outputCodecCtx->strict_std_compliance = FF_COMPLIANCE_EXPERIMENTAL;
	
	out_stream->time_base.den = _outputCodecCtx->sample_rate;
	out_stream->time_base.num = 1;
	/* Some container formats (like MP4) require global headers to be present.
	 * Mark the encoder so that it behaves accordingly. */
	if (_ofmtCtx->oformat->flags & AVFMT_GLOBALHEADER)
		_outputCodecCtx->flags |= AV_CODEC_FLAG_GLOBAL_HEADER;

	 AVDictionary* codecOutOptions = NULL;
	 ret = av_dict_set(&codecOutOptions, "profile", "aac_low", 0);
	 if (ret < 0) {
	 	throw EXCEPTION_MESSAGE(Exception, ret, "Error on setting the option of profile");
	 }
	
	/* Open the encoder for the audio stream to use it later. */
	ret = avcodec_open2(_outputCodecCtx, _outputCodec, &codecOutOptions);
	//ret = avcodec_open2(_outputCodecCtx, _outputCodec, nullptr);
	if (ret < 0) {
		throw EXCEPTION_MESSAGE(Exception, ret, "Failed avcodec_open2 for output");
	}

	ret = avcodec_parameters_from_context(out_stream->codecpar, _outputCodecCtx);
	if (ret < 0) {
		throw EXCEPTION_MESSAGE(Exception, ret, "Failed avcodec_parameters_from_context");
	}

	allocResampler();
	allocAudioFifo();
	
	return true;
}


