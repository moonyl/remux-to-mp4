#pragma once

#include <QTimer>

class RemuxerManager;

class RemuxScheduler
{
	QTimer _timer;
	RemuxerManager& _manager;

public:
	RemuxScheduler(RemuxerManager& manager);

	void start()
	{
		_timer.start();
	}
};