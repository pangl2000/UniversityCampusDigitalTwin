# import math
from pyproj import Proj # Get your path "...\UE_5.3\Engine\Binaries\ThirdParty\Python3\Win64\python.exe" and 
                        # in cmd type: <your_path> -m pip install pyproj


origin_latitude = 38.285720
origin_longitude = 21.789350


def latlon_to_utm(latitude, longitude):

    P = Proj(proj='utm', zone=34, ellps='WGS84', preserve_units=True)

    # Convert latitude and longitude to UTM
    utm_x, utm_y = P(longitude, latitude)

    return utm_x, utm_y


def fixedUEngineUnits(lat, lon):
    (orig_x, orig_y) = latlon_to_utm(origin_latitude, origin_longitude)
    (real_x, real_y) = latlon_to_utm(lat, lon)
    fixed_x = real_x - orig_x
    fixed_y = orig_y - real_y
    return (fixed_x, fixed_y)

print(latlon_to_utm(origin_latitude, origin_longitude))
