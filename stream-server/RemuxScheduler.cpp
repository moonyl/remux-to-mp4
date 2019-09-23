#include "RemuxScheduler.h"
#include "RemuxerManager.h"

RemuxScheduler::RemuxScheduler(RemuxerManager& manager): _manager(manager)
{
	_timer.setInterval(0);
	QObject::connect(&_timer, &QTimer::timeout, [this]()
	{
		//QList<QUuid> tobeRemoved;
		for (const auto& remuxer : _manager.remuxers()) {
			auto result = remuxer->remux();
			remuxer->sendRemuxed(result);
		}
		_manager.cleanupEnded();

		if (_manager.isEmpty()) {
			_timer.stop();
		}
	});
}
