#include "RemuxingContext.h"
#include "HeaderGenerater.h"

QByteArray doRemux(RemuxingContext* remuxer)
{
	return remuxer->remux();
};

RemuxingContext::RemuxingContext(const char* in_filename, QObject* parent):
	QObject(parent),
	_inFileName(in_filename),
	_state(new Idle),
	_resource(new RemuxResourceContext)
{
	connect(&_futureWatcher, &QFutureWatcher<QByteArray>::finished, [this]()
		{
			sendResult();
		});
}

RemuxingContext::~RemuxingContext()
{
	std::cout << "check, " << __FUNCTION__ << std::endl;
}

void RemuxingContext::setUrl(const char* inFileName)
{
	_inFileName = inFileName;
	_ended = false;
}

void RemuxingContext::asyncRemux()
{
	if (_futureWatcher.isFinished() && _tryRemuxing == false) {
		auto future = QtConcurrent::run(doRemux, this);
		_futureWatcher.setFuture(future);
		_tryRemuxing = true;
	}
}

//bool RemuxingContext::isAsyncJobFinished() const { return _future.isFinished(); }
void RemuxingContext::sendResult()
{
	//if (isAsyncJobFinished()) {
		//auto result = _future.result();
	do {
		auto result = _futureWatcher.result();
		_tryRemuxing = false;
		if (result.isEmpty()) {
			break;
		}
		for (auto socket : sockets()) {
			socket->sendBinaryMessage(result);
		}

		if (isStreamEnded()) {
			for (auto socket : _sockets.toList()) {
				socket->close();
			}
		}
	} while (false);
	emit singleStepFinished();
	//}
}

QByteArray RemuxingContext::remux()
{
	return _state->remux(this);
}

void RemuxingContext::addSocket(QWebSocket* socket)
{
	// QObject::connect(socket, &QWebSocket::disconnected, [this, socket]()
	// {
	// 	_sockets.remove(socket);
	// });
	if (_sockets.size() > 0) {
		socket->sendBinaryMessage(getHeaderByteArray(_resource->outputFormatContext(), _resource->remuxedOutput()));
	}

	connect(socket, &QWebSocket::disconnected, this, &RemuxingContext::handleSocketClosed);
	_sockets << socket;
}

QList<QWebSocket*> RemuxingContext::sockets() const
{
	return _sockets.toList();
}

bool RemuxingContext::prepared() const
{
	return (!_ended) && (!_inFileName.empty());
}

bool RemuxingContext::isStreamEnded() const
{
	// �̸��� �Ҵ���� �ʰ� ��Ʈ���� �����ٰ� �Ǵ��ϸ�, �ʱ�����̴�.
	if (_ended && (!_inFileName.empty())) {
		std::cout << "stream ended" << std::endl;
		return true;
	}
	return false;
	//return _ended && (!_inFileName.empty());
}

void RemuxingContext::changeState(RemuxingState* state)
{
	_state.reset(state);
}
void RemuxingContext::handleStreamEnd()
{
	_ended = true;
}

RemuxResourceContext& RemuxingContext::resource()
{
	return *_resource;
}

void RemuxingContext::handleSocketClosed()
{
	QWebSocket* pClient = qobject_cast<QWebSocket*>(sender());
	_sockets.remove(pClient);
}
