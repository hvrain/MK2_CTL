import pandas as pd
import numpy as np
import sys
import json
from sklearn.ensemble import RandomForestRegressor
import matplotlib.pyplot as plt
from sklearn.tree import DecisionTreeRegressor
from sklearn import tree
from sklearn.model_selection import train_test_split

path = 'grades_54321.csv'
grades = pd.read_csv(path)

#값 받아오는 부분 추가
result = json.loads(sys.argv[1])

x_test = np.array([result['과제']])
x_test = x_test.reshape(-1, 1)
y_test = result['중간점수']
x_leng = len(x_test)

#끝

# #값 받아오고 수정
if x_leng == 1:
    x_train = grades[['p1', 'middle']]
    y_train = grades[['score(100%)']]
    y_train = np.ravel(y_train, order='C')
elif x_leng == 2:
    x_train = grades[['p1', 'p2', 'middle']]
    y_train = grades[['score(100%)']]
    y_train = np.ravel(y_train, order='C')
elif x_leng == 3:
    x_train = grades[['p1', 'p2', 'p3', 'middle']]
    y_train = grades[['score(100%)']]
    y_train = np.ravel(y_train, order='C')
elif x_leng == 4:
    x_train = grades[['p1', 'p2', 'p3', 'p4', 'middle']]
    y_train = grades[['score(100%)']]
    y_train = np.ravel(y_train, order='C')
elif x_leng == 5:
    x_train = grades[['p1', 'p2', 'p3', 'p4', 'p5', 'middle']]
    y_train = grades[['score(100%)']]
    y_train = np.ravel(y_train, order='C')
elif x_leng == 6:
    x_train = grades[['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'middle']]
    y_train = grades[['score(100%)']]
    y_train = np.ravel(y_train, order='C')
# #값 값아오고 수정 끝

clf = RandomForestRegressor(random_state=42, n_estimators=50, n_jobs=-1)
clf.fit(x_train, y_train)

x_test = np.append(x_test, y_test)
x_test = x_test.reshape(1, -1)
print(clf.predict(x_test))

#추가한 부분
#중요도 출력
importance = clf.feature_importances_
print(json.dumps(importance.tolist()))
#

################################################################################################################################

if x_leng == 1:
    x_train = grades[['p1', 'middle', 'p2']]
    y_train = grades[['score(100%)']]
    y_train = np.ravel(y_train, order='C')
elif x_leng == 2:
    x_train = grades[['p1', 'p2', 'middle', 'p3']]
    y_train = grades[['score(100%)']]
    y_train = np.ravel(y_train, order='C')
elif x_leng == 3:
    x_train = grades[['p1', 'p2', 'p3', 'middle', 'p4']]
    y_train = grades[['score(100%)']]
    y_train = np.ravel(y_train, order='C')
elif x_leng == 4:
    x_train = grades[['p1', 'p2', 'p3', 'p4', 'middle', 'p5']]
    y_train = grades[['score(100%)']]
    y_train = np.ravel(y_train, order='C')
elif x_leng == 5:
    x_train = grades[['p1', 'p2', 'p3', 'p4', 'p5', 'middle', 'p6']]
    y_train = grades[['score(100%)']]
    y_train = np.ravel(y_train, order='C')
elif x_leng == 6:
    x_train = grades[['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'middle', 'last']]
    y_train = grades[['score(100%)']]
    y_train = np.ravel(y_train, order='C')

clf.fit(x_train, y_train)

arr_predict = np.array([])
arr_score = grades[['score(100%)']]
np.sort(arr_score)
i = 0

for j in range(21):
    x_test = np.append(x_test, i)
    x_test = x_test.reshape(1, -1)
    predict_value = clf.predict(x_test)
    arr_score = np.append(arr_score, predict_value)
    arr_score.sort()
    where_value = np.where(arr_score == predict_value)
    arr_score = np.delete(arr_score, where_value[0])
    where_value = where_value / np.prod(arr_score.shape)
    arr_predict = np.append(arr_predict, where_value)
    x_test = np.delete(x_test, len(x_test[0])-1)
    i = i+5

result = arr_predict*100
print(json.dumps(result.tolist()))