#include "RemuxScheduler.h"
#include "RemuxerManager.h"


RemuxScheduler::RemuxScheduler(RemuxerManager& manager): _manager(manager) {}


void RemuxScheduler::start()
{
	QTimer::singleShot(0, [this]()
	{
		doRemuxing();
	});
}
void RemuxScheduler::doRemuxing()
{
	_manager.asyncRemux();

	//_manager.monitorStream();

	_manager.cleanupEnded();
	
	// if (!_manager.isEmpty()) {
	// 	QTimer::singleShot(0, [this]()
	// 	{
	// 		doRemuxing();
	// 	});
	// }
}
