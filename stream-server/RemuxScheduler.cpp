#include "RemuxScheduler.h"
#include "RemuxerManager.h"
#include <QtConcurrent>
#include <QSharedPointer>

//QPair<QList<QWebSocket*>,QByteArray> doRemux(QSharedPointer<RemuxingContext> remuxer)
QPair<QUuid, QByteArray> doRemux(const QSharedPointer<RemuxingContext>& remuxer, const QUuid& camId)
{
	//std::cout << __FUNCTION__ << ", " << remuxer.data() << std::endl;
	//return { remuxer->sockets(), remuxer->remux() };
	//return QByteArray();
	return { camId, remuxer->remux() };
};

RemuxScheduler::RemuxScheduler(RemuxerManager& manager): _manager(manager)
{
	// QObject::connect(&_remuxingFuture, &decltype(_remuxingFuture)::resultReadyAt, [this](int index) {
	// 	auto & result = _remuxingFuture.resultAt(index);
	// 	if (result.second.isEmpty()) {
	// 		return;
	// 	}
	// 	const auto& socketList = result.first;
	// 	for (const auto& socket : socketList) {
	// 		//std::cout << "socket: " << socket << std::endl;
	// 		socket->sendBinaryMessage(result.second);
	// 	}
	// });
	//
	// QObject::connect(&_remuxingFuture, &decltype(_remuxingFuture)::finished, [this]() {
	// 	for (const auto& remuxer : _manager.remuxers()) {
	// 		remuxer->monitorStream();
	// 	}
	//
	// 	_manager.cleanupEnded();
	//
	// 	// if (_manager.isEmpty()) {
	// 	// 	_timer.stop();
	// 	// }
	//
	// 	if (!_manager.isEmpty()) {
	// 		QTimer::singleShot(0, [this]()
	// 			{
	// 				doRemuxing();
	// 			});
	// 	}
	// });

}


void RemuxScheduler::start()
{
	// if (!_timer.isActive()) {
	// 	_timer.start();
	// }

	QTimer::singleShot(0, [this]()
		{
			doRemuxing();
		});
}
void RemuxScheduler::doRemuxing()
{
	//QList<QSharedPointer<RemuxingContext>> prepared;
	
	// QList<QFuture<QPair<QUuid, QByteArray>>> futures;
	// for (const auto& key : _manager.keys()) {
	// 	if (_manager[key]->prepared() && _remuxAvailables[key]) {
	// 		futures << QtConcurrent::run(doRemux, _manager[key], key);
	// 		_remuxAvailables[key] = false;
	// 		//prepared << remuxer;
	// 	}
	// }

	_manager.asynRemux();

	_manager.monitorStream();

	_manager.cleanupEnded();
	if (!_manager.isEmpty()) {
		QTimer::singleShot(0, [this]()
			{
				doRemuxing();
			});
	}
		

	//_remuxingFuture.setFuture(QtConcurrent::mapped(prepared, doRemux));
	
}
