#include "RemuxingContext.h"

QByteArray doRemux(RemuxingContext* remuxer)
{
	//std::cout << __FUNCTION__ << ", " << remuxer.data() << std::endl;
	//return { remuxer->sockets(), remuxer->remux() };
	//return QByteArray();
	return remuxer->remux();
};

void RemuxingContext::asyncRemux()
{
	if (_future.isFinished() && _tryRemuxing == false) {
		_future = QtConcurrent::run(doRemux, this);
		_tryRemuxing = true;
	}
}
