#ifndef MAIN_H
#define MAIN_H

#define STR_HELPER(x) #x
#define STR(x) STR_HELPER(x)

#define PROJECT_NAME            "BatteryCapacitor"
#define VERSION_MAJOR           0
#define VERSION_MINOR           1
#define VERSION_BUILD           1


#define VERSION_STRING STR(VERSION_MAJOR) "." STR(VERSION_MINOR) "." STR(VERSION_BUILD)
#define VERSION_DATE  __DATE__


#define BAUDRATE        115200


#endif /* MAIN_H */
