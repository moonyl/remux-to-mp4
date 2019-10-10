// onvif-control-server.cpp : 애플리케이션의 진입점을 정의합니다.
//
#include "OnvifDeviceScanner.h"
#include "OnvifDiscoveryService.h"

int main(int argc, char** argv)
{
	QCoreApplication coreApplication(argc, argv);	

	OnvifDiscoveryService onvifService;	
	return coreApplication.exec();
}
