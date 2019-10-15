# CMakeList.txt: onvif-control-server에 대한 CMake 프로젝트, 여기에 소스를 포함하고
# 프로젝트 특정 논리를 정의합니다.
#
cmake_minimum_required (VERSION 3.14)
project(onvif_control_server)

set(CMAKE_CXX_STANDARD 14)

set(CMAKE_INCLUDE_CURRENT_DIR ON)
set(CMAKE_AUTOMOC ON)

find_package(Qt5 COMPONENTS Core Network Concurrent REQUIRED)
get_target_property(QtCore_location Qt5::Core LOCATION_Debug)
message(STATUS "QtCore_location=${QtCore_location}, ${CMAKE_BUILD_TYPE}")


find_package(Subversion)
message(STATUS ${SUBVERSION_FOUND} ${Subversion_SVN_EXECUTABLE})

set (OPENSSL_BIN_LOC ${CMAKE_SOURCE_DIR}/refs/openssl)
set (OPENSSL_SVN_URL https://192.168.15.10:8443/svn/team2.repo/openssl2/trunk)

set (BASEKIT_SRC_LOC ${CMAKE_SOURCE_DIR}/refs/basekit)
set (BASEKIT_SVN_URL https://192.168.15.10:8443/svn/team2.repo/basekit/trunk)

set (MEDIAKIT_SRC_LOC ${CMAKE_SOURCE_DIR}/refs/mediakit)
set (MEDIAKIT_SVN_URL https://192.168.15.10:8443/svn/team2.repo/mediakit/trunk)

set (NETWORKKIT_SRC_LOC ${CMAKE_SOURCE_DIR}/refs/networkkit)
set (NETWORKKIT_SVN_URL https://192.168.15.10:8443/svn/team2.repo/networkkit/trunk)

set (ONVIFKIT_SRC_LOC ${CMAKE_SOURCE_DIR}/refs/onvifkit)
set (ONVIFKIT_SVN_URL https://192.168.15.10:8443/svn/team2.repo/onvifkit/trunk)

function (checkoutFromSvn SVN_URL SRC_LOC REPO_NAME)	
	if (NOT EXISTS ${SRC_LOC})
		execute_process(COMMAND ${Subversion_SVN_EXECUTABLE} co ${SVN_URL} ${SRC_LOC} RESULT_VARIABLE svn_co_result)
		#message(STATUS svn_co_result=${svn_co_result})
		if (NOT svn_co_result STREQUAL "0")
			message(FATAL_ERROR "checkout ${REPO_NAME} repository failed")
		endif()
	endif()
endfunction()

if(SUBVERSION_FOUND)
	checkoutFromSvn(${OPENSSL_SVN_URL} ${OPENSSL_BIN_LOC} openssl)
	checkoutFromSvn(${BASEKIT_SVN_URL} ${BASEKIT_SRC_LOC} basekit)
	checkoutFromSvn(${MEDIAKIT_SVN_URL} ${MEDIAKIT_SRC_LOC} mediakit)
	checkoutFromSvn(${NETWORKKIT_SVN_URL} ${NETWORKKIT_SRC_LOC} networkkit)	
	checkoutFromSvn(${ONVIFKIT_SVN_URL} ${ONVIFKIT_SRC_LOC} onvifkit)
endif()

# openssl
add_library(ssleay SHARED IMPORTED)
set_target_properties(ssleay PROPERTIES 
	IMPORTED_LOCATION ${OPENSSL_BIN_LOC}/x64/bin/ssleay32.dll 
	IMPORTED_IMPLIB ${OPENSSL_BIN_LOC}/x64/lib/ssleay32.lib)

add_library(libeay SHARED IMPORTED)
set_target_properties(libeay PROPERTIES 
	IMPORTED_LOCATION ${OPENSSL_BIN_LOC}/x64/bin/libeay32.dll 
	IMPORTED_IMPLIB ${OPENSSL_BIN_LOC}/x64/lib/libeay32.lib)


# basekit
file(GLOB BASEKIT_SOURCE ${BASEKIT_SRC_LOC}/*.c* ${BASEKIT_SRC_LOC}/log/*.c* ${BASEKIT_SRC_LOC}/thread/*.c* ${BASEKIT_SRC_LOC}/tool/*.c*)
add_library(basekit STATIC ${BASEKIT_SOURCE})
#TODO: debug와 release 구분
target_compile_definitions(basekit PRIVATE _OPENSSL UNICODE _UNICODE WIN32 _ENABLE_EXTENDED_ALIGNED_STORAGE WIN64 BASEKIT_LIB BUILD_STATIC QT_CORE_LIB)
#target_compile_definitions(basekit PRIVATE UNICODE _UNICODE WIN32 _ENABLE_EXTENDED_ALIGNED_STORAGE WIN64 QT_NO_DEBUG NDEBUG BASEKIT_LIB BUILD_STATIC QT_CORE_LIB)
target_include_directories(basekit PUBLIC ${CMAKE_SOURCE_DIR}/refs ${CMAKE_SOURCE_DIR}/refs/openssl/x64)
target_link_libraries(basekit PUBLIC Qt5::Core)

# networkit
file(GLOB NETWORKKIT_SOURCE ${NETWORKKIT_SRC_LOC}/*.c* 
	${NETWORKKIT_SRC_LOC}/client/*.c* 
	${NETWORKKIT_SRC_LOC}/live/*.c* 
	${NETWORKKIT_SRC_LOC}/management/*.c*
	${NETWORKKIT_SRC_LOC}/playback/*.c*
	${NETWORKKIT_SRC_LOC}/record/*.c*
	${NETWORKKIT_SRC_LOC}/server/*.c*
	${NETWORKKIT_SRC_LOC}/tool/*.c*)

list(REMOVE_ITEM NETWORKKIT_SOURCE ${NETWORKKIT_SRC_LOC}/SessionMessage.cpp)
add_library(networkkit STATIC ${NETWORKKIT_SOURCE})
#TODO: debug와 release 구분
target_compile_definitions(networkkit PRIVATE UNICODE _UNICODE WIN32 _ENABLE_EXTENDED_ALIGNED_STORAGE WIN64 QT_CORE_LIB QT_NETWORK_LIB NETWORKKIT_LIB BUILD_STATIC)
#target_compile_definitions(networkkit PRIVATE UNICODE _UNICODE WIN32 _ENABLE_EXTENDED_ALIGNED_STORAGE WIN64 QT_NO_DEBUG NDEBUG QT_CORE_LIB QT_NETWORK_LIB NETWORKKIT_LIB BUILD_STATIC)
target_include_directories(networkkit PUBLIC ${CMAKE_SOURCE_DIR}/refs)
target_link_libraries(networkkit PUBLIC Qt5::Network)

# mediakit
file(GLOB MEDIAKIT_SOURCE ${MEDIAKIT_SRC_LOC}/*.c*)

add_library(mediakit STATIC ${MEDIAKIT_SOURCE})
#TODO: debug와 release 구분
target_compile_definitions(mediakit PRIVATE UNICODE _UNICODE WIN32 _ENABLE_EXTENDED_ALIGNED_STORAGE WIN64 QT_CORE_LIB MEDIAKIT_LIB BUILD_STATIC)
#target_compile_definitions(mediakit PRIVATE UNICODE _UNICODE WIN32 _ENABLE_EXTENDED_ALIGNED_STORAGE WIN64 QT_NO_DEBUG NDEBUG QT_CORE_LIB MEDIAKIT_LIB BUILD_STATIC)
target_include_directories(mediakit PUBLIC ${CMAKE_SOURCE_DIR}/refs)
target_link_libraries(mediakit PUBLIC Qt5::Network)

# onvifkit
file(GLOB ONVIFKIT_SOURCE 
	${ONVIFKIT_SRC_LOC}/*.c* 
	${ONVIFKIT_SRC_LOC}/service/*.c* 
	${ONVIFKIT_SRC_LOC}/service/analytics/*.c*
	${ONVIFKIT_SRC_LOC}/service/device/*.c*
	${ONVIFKIT_SRC_LOC}/service/event/*.c*
	${ONVIFKIT_SRC_LOC}/service/imaging/*.c*
	${ONVIFKIT_SRC_LOC}/service/media/*.c*
	${ONVIFKIT_SRC_LOC}/service/ptz/*.c*
	${ONVIFKIT_SRC_LOC}/soap/*.c*)

add_library(onvifkit STATIC ${ONVIFKIT_SOURCE})
target_compile_definitions(onvifkit PRIVATE UNICODE _UNICODE WIN32 _ENABLE_EXTENDED_ALIGNED_STORAGE WIN64 WIN32_LEAN_AND_MEAN WITH_OPENSSL WITH_NONAMESPACES QT_CONCURRENT_LIB QT_CORE_LIB QT_NETWORK_LIB QT_XML_LIB ONVIFKIT_LIB BUILD_STATIC)
#target_compile_definitions(onvifkit PRIVATE UNICODE _UNICODE WIN32 _ENABLE_EXTENDED_ALIGNED_STORAGE WIN64;WIN32_LEAN_AND_MEAN WITH_OPENSSL WITH_NONAMESPACES QT_NO_DEBUG NDEBUG QT_CONCURRENT_LIB QT_CORE_LIB QT_NETWORK_LIB QT_XML_LIB ONVIFKIT_LIB BUILD_STATIC)
target_compile_options(onvifkit PRIVATE /bigobj)
target_link_libraries(onvifkit PUBLIC ssleay libeay basekit mediakit networkkit Qt5::Concurrent)
target_include_directories(onvifkit PRIVATE ${CMAKE_SOURCE_DIR}/refs/onvifkit)

# 이 프로젝트의 실행 파일에 소스를 추가합니다.
add_executable (onvif_control_server 
	main.cpp
	OnvifDeviceScanner.cpp
	OnvifDeviceScanner.h
	OnvifDiscoveryService.h
	onvifHandlers.cpp
	onvifHandlers.h
	OnvifRequestProcessor.cpp
	OnvifRequestProcessor.h
	utils.h)
target_link_libraries(onvif_control_server PRIVATE networkkit onvifkit)
target_include_directories(onvif_control_server PRIVATE ${CMAKE_SOURCE_DIR}/refs)