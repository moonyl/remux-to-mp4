
#include "RemuxingState.h"
#include "RemuxingContext.h"
#include "HeaderGenerater.h"
#include "FrameRemuxer.h"
#include <basekit/Exception.h>

bool HeaderGenerate::remux(RemuxingContext* context)
{
	try {
		HeaderGenerater generater(context->resource());
		generater.makeHeader(context->_inFileName.c_str(), context->_socket);
	} catch(Exception& e) {
		throw e;
	}
	context->changeState(new RemuxStream);
	return true;
}

bool RemuxStream::remux(RemuxingContext* context)
{
	try {
		if (!_frameRemuxer) {
			_frameRemuxer.reset(new FrameRemuxer(context->resource()));
		}
		_frameRemuxer->remux();
	} catch(Exception& e) {
		if (e.message() == "test finished") {
			context->changeState(new TrailerWrite);
			return true;
		}
	}
	return true;
}

bool TrailerWrite::remux(RemuxingContext* context)
{
	int ret = av_write_trailer(context->resource().outputFormatContext());
	if (ret < 0) {
		throw EXCEPTION_MESSAGE(Exception, ret, "Error on writing trailer");
	}
	return false;
}

bool ResourceRelease::remux(RemuxingContext* context)
{
	return false;
}
