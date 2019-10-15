#pragma once

#include <iostream>
#include <QtGlobal>
class QString;
class QByteArray;


inline std::ostream& operator<<(std::ostream& os, const QString& str)
{
	os << qPrintable(str);
	return os;
}

inline std::ostream& operator<<(std::ostream& os, const QByteArray& str)
{
	os << qPrintable(str);
	return os;
}