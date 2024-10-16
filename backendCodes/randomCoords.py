import random
from shapely.geometry import Polygon, Point # Version 1.8.5

# ____________________________________________________________________
# Return random point in polygon
def random_point_in_polygon(vertices_x):
    # Define vertices of the polygon with 8 vertices
    vertices = vertices_x
    polygon = Polygon(vertices)
    
    x_values = [point[0] for point in vertices]
    y_values = [point[1] for point in vertices]

    max_x = max(x_values)
    min_x = min(x_values)

    max_y = max(y_values)
    min_y = min(y_values)

    # Generate random points until one is found inside the polygon
    while True:
        x = random.uniform(min_x, max_x)
        y = random.uniform(min_y, max_y)
        point = Point(x, y)
        if polygon.contains(point):
            x = point.coords.xy[0][0]
            y = point.coords.xy[1][0]
            return (x ,y)

# Return random point in line
def random_point_on_line(point1, point2):
    # Generate a random value between 0 and 1
    x1 = point1[0]
    y1 = point1[1]
    x2 = point2[0]
    y2 = point2[1]

    t = random.random()
    
    # Calculate the coordinates of the point along the line
    x = (1 - t) * x1 + t * x2
    y = (1 - t) * y1 + t * y2
    
    return (x, y)
# ____________________________________________________________________




# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -



# # ____________________________________________________________________
# # Define a function to parse the text and extract tuples
# def parse_line(line):
#     parts = line.strip().split(',')
#     pin_name = parts[0]
#     pin_number = parts[1]
#     latitude = float(parts[2])
#     longitude = float(parts[3])
#     height = int(parts[4])
#     return [pin_name ,latitude, longitude]

# # Define a list to store tuples for each line
# lines = [[]]

# # Read the text and parse each line
# with open('output_paths.txt', 'r') as file:
#     next(file)
#     for line in file:
#         if(int(parse_line(line)[0][4:]) > len(lines)) :
#             lines.append([])
#         lines[int(parse_line(line)[0][4:])-1].append((parse_line(line)[1],parse_line(line)[2]))

# polygons = [[]]

# # Read the text and parse each line
# with open('output_polygons.txt', 'r') as file:
#     next(file)
#     for line in file:
#         if(int(parse_line(line)[0][7:]) > len(polygons)) :
#             polygons.append([])
#         polygons[int(parse_line(line)[0][7:])-1].append((parse_line(line)[1],parse_line(line)[2]))
# # ____________________________________________________________________




# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -




# ____________________________________________________________________
# Test the functions
# point_in_polygon_4 = random_point_in_polygon(polygons[0][0:4])
# print("Random point inside polygon with 4 vertices:", point_in_polygon_4)

# point_in_polygon_8 = random_point_in_polygon(polygons[1][0:8])
# print("Random point inside polygon with 8 vertices:", point_in_polygon_8)

# for i in range(0,len(lines)):
#     print("Random point inside line", i, ":", random_point_on_line(lines[i][0],lines[i][1]))
polygons = [
    [
     (38.2861286, 21.7892607), 
     (38.2858254, 21.7892661), 
     (38.2858254, 21.7895879), 
     (38.2861328, 21.7895665), 
     (38.2861286, 21.7892607)
     ],
    [
     (38.2862165, 21.7896076), 
     (38.2861492, 21.7896398), 
     (38.2861492, 21.7897524), 
     (38.2860102, 21.7897578), 
     (38.2860102, 21.7898624),
     (38.2861913, 21.789841), 
     (38.2861786, 21.7896908), 
     (38.2862292, 21.789672), 
     (38.2862165, 21.7896076)
     ]
     ]

lines = [
    [
    (38.2858996, 21.7855716), 
    (38.2869186, 21.7875028), 
    (38.2867754, 21.7882484), 
    (38.2864175, 21.7888224), 
    (38.2864302, 21.7889619), 
    (38.286367, 21.7890799), 
    (38.2863375, 21.7896217), 
    (38.2861691, 21.7896647), 
    (38.2861733, 21.7897988), 
    (38.2859838, 21.7898095), 
    (38.2859796, 21.7895735)
    ], 
    [
    (38.2887165, 21.7868322), 
    (38.288346, 21.7868483), 
    (38.2882786, 21.7868859), 
    (38.287946, 21.7866284), 
    (38.2870197, 21.7874116), 
    (38.2869186, 21.7875028)
    ], 
    [
    (38.2876513, 21.7884094), 
    (38.2870997, 21.7884255), 
    (38.2870155, 21.7883557), 
    (38.2867754, 21.7882484)
    ], 
    [
    (38.287647, 21.7884523), 
    (38.2871039, 21.7884738), 
    (38.2871207, 21.7889673), 
    (38.2870449, 21.7890317), 
    (38.2868723, 21.7892301), 
    (38.2867291, 21.7894393), 
    (38.2866449, 21.7894662), 
    (38.2866407, 21.7896056), 
    (38.2863375, 21.7896217)
    ], 
    [
    (38.2859586, 21.7891926), 
    (38.2856765, 21.7885757), 
    (38.2855207, 21.7887098), 
    (38.2853901, 21.7884684), 
    (38.2853017, 21.7885381), 
    (38.2848806, 21.7876959)
    ], 
    [
    (38.2859586, 21.7891926), 
    (38.2861691, 21.7891926), 
    (38.2861691, 21.7896647)
    ], 
    [
    (38.2877073, 21.7914035), 
    (38.2876989, 21.7900141), 
    (38.2871136, 21.7899873), 
    (38.2866589, 21.7899551), 
    (38.2866407, 21.7896056)
    ], 
    [
    (38.2880821, 21.7907329), 
    (38.2880736, 21.7905344), 
    (38.2877115, 21.7905344)
    ], 
    [
    (38.2879263, 21.7895957), 
    (38.2879221, 21.7898853), 
    (38.2871136, 21.7898693), 
    (38.2867178, 21.7898639), 
    (38.2866407, 21.7896056)
    ], 
    [
    (38.28812, 21.7900838), 
    (38.2877031, 21.7900838)
    ], 
    [
    (38.2883558, 21.7897351), 
    (38.2883473, 21.7900677), 
    (38.28812, 21.7900838)
    ], 
    [
    (38.2886842, 21.7896386), 
    (38.2883473, 21.7900677)
    ], 
    [
    (38.2899981, 21.7956819), 
    (38.2873202, 21.790972), 
    (38.2871855, 21.7905535), 
    (38.2871265, 21.790178), 
    (38.2871136, 21.7899873)
    ]
    ]
# ____________________________________________________________________

AP_Polygons = [[
                (38.286123, 21.789317),
                (38.286123, 21.789599),
                (38.285957, 21.789604),
                (38.285955, 21.789320)
                ],
                [
                (38.285955, 21.789320),
                (38.285957, 21.789604),
                (38.285878, 21.789605),
                (38.285878, 21.789681),
                (38.285785, 21.789687),
                (38.285781, 21.789322)
                ],
                [
                (38.286123, 21.789599),
                (38.285957, 21.789604),
                (38.285935, 21.790144),
                (38.286152, 21.790145),
                (38.286155, 21.789963),
                (38.286200, 21.789958),
                (38.286198, 21.789597)
                ],
                [
                (38.285957, 21.789604),
                (38.285878, 21.789605),
                (38.285878, 21.789681),
                (38.285785, 21.789687),
                (38.285784, 21.790152),
                (38.285935, 21.790144)
                ],
                [
                (38.285935, 21.790144),
                (38.285784, 21.790152),
                (38.285791, 21.790970),
                (38.285979, 21.790967)
                ]]



# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -




# ____________________________________________________________________
# Function that picks random points from all allowed areas
def generalRandomPoint():
    points = []
    points.append(random_point_in_polygon(polygons[0][0:4]))
    points.append(random_point_in_polygon(polygons[1][0:8]))
    for i in range(0,len(lines)):
        points.append(random_point_on_line(lines[i][0],lines[i][1]))
    return random.choice(points)
# ____________________________________________________________________

def uniSimulation(area):
    if area == 'polygon1':
        newPoint = random_point_in_polygon(polygons[0][0:4])
        newArea = 'polygon1'
    elif area == 'polygon2':
        newPoint = random_point_in_polygon(polygons[1][0:8])
        newArea = 'polygon2'
    else:
        lineNum = int(area[4:])
        line = int(lineNum // 10)
        offset = int(lineNum % 10)
        if offset+1 < len(lines[line]):
            newPoint = random_point_on_line(lines[line][offset],lines[line][offset+1])
            newArea = 'line'+str(line)+str(offset+1)
        elif offset+1 == len(lines[line]):
            newPoint = random_point_on_line(lines[line][offset],lines[line][offset-1])
            newArea = 'line'+str(line)+str(offset)
        
        if area == 'line14':
            newArea = 'line01'

        if area == 'line22':
            newArea = 'line02'

        if area == 'line37':
            newArea = 'line06'
        
        if area == 'line44':
            newArea = 'line50'

        if area == 'line51':
            newArea = 'line07'
        
        if area == 'line63':
            newArea = 'line37'
        
        if area == 'line71':
            newArea = 'line61'
        
        if area == 'line83':
            newArea = 'line37'
        
        if area == 'line90':
            newArea = 'line61'

    return newPoint,newArea

def random_point_in_AP(area):
    if area == 'R0_EST-AP_0.1':
        return random_point_in_polygon(AP_Polygons[0])
    elif area == 'R0_EST-AP_0.2':
        return random_point_in_polygon(AP_Polygons[1])
    elif area == 'R0_EST-AP_0.3':
        return random_point_in_polygon(AP_Polygons[2])
    elif area == 'R0_EST-AP_0.4':
        return random_point_in_polygon(AP_Polygons[3])
    elif area == 'R0_AMF-AP_0.3':
        return random_point_in_polygon(AP_Polygons[4])
    else:
        return None