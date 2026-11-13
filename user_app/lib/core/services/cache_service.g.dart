// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'cache_service.dart';

// **************************************************************************
// IsarCollectionGenerator
// **************************************************************************

// coverage:ignore-file
// ignore_for_file: duplicate_ignore, non_constant_identifier_names, constant_identifier_names, invalid_use_of_protected_member, unnecessary_cast, prefer_const_constructors, lines_longer_than_80_chars, require_trailing_commas, inference_failure_on_function_invocation, unnecessary_parenthesis, unnecessary_raw_strings, unnecessary_null_checks, join_return_with_assignment, prefer_final_locals, avoid_js_rounded_ints, avoid_positional_boolean_parameters, always_specify_types

extension GetCachedSceneCollection on Isar {
  IsarCollection<CachedScene> get cachedScenes => this.collection();
}

const CachedSceneSchema = CollectionSchema(
  name: r'CachedScene',
  id: 7123136446409454226,
  properties: {
    r'cachedAt': PropertySchema(
      id: 0,
      name: r'cachedAt',
      type: IsarType.dateTime,
    ),
    r'jsonPayload': PropertySchema(
      id: 1,
      name: r'jsonPayload',
      type: IsarType.string,
    ),
    r'qrId': PropertySchema(
      id: 2,
      name: r'qrId',
      type: IsarType.string,
    )
  },
  estimateSize: _cachedSceneEstimateSize,
  serialize: _cachedSceneSerialize,
  deserialize: _cachedSceneDeserialize,
  deserializeProp: _cachedSceneDeserializeProp,
  idName: r'id',
  indexes: {
    r'qrId': IndexSchema(
      id: -5280225836568822587,
      name: r'qrId',
      unique: true,
      replace: true,
      properties: [
        IndexPropertySchema(
          name: r'qrId',
          type: IndexType.hash,
          caseSensitive: true,
        )
      ],
    )
  },
  links: {},
  embeddedSchemas: {},
  getId: _cachedSceneGetId,
  getLinks: _cachedSceneGetLinks,
  attach: _cachedSceneAttach,
  version: '3.1.0+1',
);

int _cachedSceneEstimateSize(
  CachedScene object,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  var bytesCount = offsets.last;
  bytesCount += 3 + object.jsonPayload.length * 3;
  bytesCount += 3 + object.qrId.length * 3;
  return bytesCount;
}

void _cachedSceneSerialize(
  CachedScene object,
  IsarWriter writer,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  writer.writeDateTime(offsets[0], object.cachedAt);
  writer.writeString(offsets[1], object.jsonPayload);
  writer.writeString(offsets[2], object.qrId);
}

CachedScene _cachedSceneDeserialize(
  Id id,
  IsarReader reader,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  final object = CachedScene();
  object.cachedAt = reader.readDateTime(offsets[0]);
  object.id = id;
  object.jsonPayload = reader.readString(offsets[1]);
  object.qrId = reader.readString(offsets[2]);
  return object;
}

P _cachedSceneDeserializeProp<P>(
  IsarReader reader,
  int propertyId,
  int offset,
  Map<Type, List<int>> allOffsets,
) {
  switch (propertyId) {
    case 0:
      return (reader.readDateTime(offset)) as P;
    case 1:
      return (reader.readString(offset)) as P;
    case 2:
      return (reader.readString(offset)) as P;
    default:
      throw IsarError('Unknown property with id $propertyId');
  }
}

Id _cachedSceneGetId(CachedScene object) {
  return object.id;
}

List<IsarLinkBase<dynamic>> _cachedSceneGetLinks(CachedScene object) {
  return [];
}

void _cachedSceneAttach(
    IsarCollection<dynamic> col, Id id, CachedScene object) {
  object.id = id;
}

extension CachedSceneByIndex on IsarCollection<CachedScene> {
  Future<CachedScene?> getByQrId(String qrId) {
    return getByIndex(r'qrId', [qrId]);
  }

  CachedScene? getByQrIdSync(String qrId) {
    return getByIndexSync(r'qrId', [qrId]);
  }

  Future<bool> deleteByQrId(String qrId) {
    return deleteByIndex(r'qrId', [qrId]);
  }

  bool deleteByQrIdSync(String qrId) {
    return deleteByIndexSync(r'qrId', [qrId]);
  }

  Future<List<CachedScene?>> getAllByQrId(List<String> qrIdValues) {
    final values = qrIdValues.map((e) => [e]).toList();
    return getAllByIndex(r'qrId', values);
  }

  List<CachedScene?> getAllByQrIdSync(List<String> qrIdValues) {
    final values = qrIdValues.map((e) => [e]).toList();
    return getAllByIndexSync(r'qrId', values);
  }

  Future<int> deleteAllByQrId(List<String> qrIdValues) {
    final values = qrIdValues.map((e) => [e]).toList();
    return deleteAllByIndex(r'qrId', values);
  }

  int deleteAllByQrIdSync(List<String> qrIdValues) {
    final values = qrIdValues.map((e) => [e]).toList();
    return deleteAllByIndexSync(r'qrId', values);
  }

  Future<Id> putByQrId(CachedScene object) {
    return putByIndex(r'qrId', object);
  }

  Id putByQrIdSync(CachedScene object, {bool saveLinks = true}) {
    return putByIndexSync(r'qrId', object, saveLinks: saveLinks);
  }

  Future<List<Id>> putAllByQrId(List<CachedScene> objects) {
    return putAllByIndex(r'qrId', objects);
  }

  List<Id> putAllByQrIdSync(List<CachedScene> objects,
      {bool saveLinks = true}) {
    return putAllByIndexSync(r'qrId', objects, saveLinks: saveLinks);
  }
}

extension CachedSceneQueryWhereSort
    on QueryBuilder<CachedScene, CachedScene, QWhere> {
  QueryBuilder<CachedScene, CachedScene, QAfterWhere> anyId() {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(const IdWhereClause.any());
    });
  }
}

extension CachedSceneQueryWhere
    on QueryBuilder<CachedScene, CachedScene, QWhereClause> {
  QueryBuilder<CachedScene, CachedScene, QAfterWhereClause> idEqualTo(Id id) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IdWhereClause.between(
        lower: id,
        upper: id,
      ));
    });
  }

  QueryBuilder<CachedScene, CachedScene, QAfterWhereClause> idNotEqualTo(
      Id id) {
    return QueryBuilder.apply(this, (query) {
      if (query.whereSort == Sort.asc) {
        return query
            .addWhereClause(
              IdWhereClause.lessThan(upper: id, includeUpper: false),
            )
            .addWhereClause(
              IdWhereClause.greaterThan(lower: id, includeLower: false),
            );
      } else {
        return query
            .addWhereClause(
              IdWhereClause.greaterThan(lower: id, includeLower: false),
            )
            .addWhereClause(
              IdWhereClause.lessThan(upper: id, includeUpper: false),
            );
      }
    });
  }

  QueryBuilder<CachedScene, CachedScene, QAfterWhereClause> idGreaterThan(Id id,
      {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.greaterThan(lower: id, includeLower: include),
      );
    });
  }

  QueryBuilder<CachedScene, CachedScene, QAfterWhereClause> idLessThan(Id id,
      {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.lessThan(upper: id, includeUpper: include),
      );
    });
  }

  QueryBuilder<CachedScene, CachedScene, QAfterWhereClause> idBetween(
    Id lowerId,
    Id upperId, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IdWhereClause.between(
        lower: lowerId,
        includeLower: includeLower,
        upper: upperId,
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<CachedScene, CachedScene, QAfterWhereClause> qrIdEqualTo(
      String qrId) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IndexWhereClause.equalTo(
        indexName: r'qrId',
        value: [qrId],
      ));
    });
  }

  QueryBuilder<CachedScene, CachedScene, QAfterWhereClause> qrIdNotEqualTo(
      String qrId) {
    return QueryBuilder.apply(this, (query) {
      if (query.whereSort == Sort.asc) {
        return query
            .addWhereClause(IndexWhereClause.between(
              indexName: r'qrId',
              lower: [],
              upper: [qrId],
              includeUpper: false,
            ))
            .addWhereClause(IndexWhereClause.between(
              indexName: r'qrId',
              lower: [qrId],
              includeLower: false,
              upper: [],
            ));
      } else {
        return query
            .addWhereClause(IndexWhereClause.between(
              indexName: r'qrId',
              lower: [qrId],
              includeLower: false,
              upper: [],
            ))
            .addWhereClause(IndexWhereClause.between(
              indexName: r'qrId',
              lower: [],
              upper: [qrId],
              includeUpper: false,
            ));
      }
    });
  }
}

extension CachedSceneQueryFilter
    on QueryBuilder<CachedScene, CachedScene, QFilterCondition> {
  QueryBuilder<CachedScene, CachedScene, QAfterFilterCondition> cachedAtEqualTo(
      DateTime value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'cachedAt',
        value: value,
      ));
    });
  }

  QueryBuilder<CachedScene, CachedScene, QAfterFilterCondition>
      cachedAtGreaterThan(
    DateTime value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'cachedAt',
        value: value,
      ));
    });
  }

  QueryBuilder<CachedScene, CachedScene, QAfterFilterCondition>
      cachedAtLessThan(
    DateTime value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'cachedAt',
        value: value,
      ));
    });
  }

  QueryBuilder<CachedScene, CachedScene, QAfterFilterCondition> cachedAtBetween(
    DateTime lower,
    DateTime upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'cachedAt',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<CachedScene, CachedScene, QAfterFilterCondition> idEqualTo(
      Id value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'id',
        value: value,
      ));
    });
  }

  QueryBuilder<CachedScene, CachedScene, QAfterFilterCondition> idGreaterThan(
    Id value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'id',
        value: value,
      ));
    });
  }

  QueryBuilder<CachedScene, CachedScene, QAfterFilterCondition> idLessThan(
    Id value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'id',
        value: value,
      ));
    });
  }

  QueryBuilder<CachedScene, CachedScene, QAfterFilterCondition> idBetween(
    Id lower,
    Id upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'id',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<CachedScene, CachedScene, QAfterFilterCondition>
      jsonPayloadEqualTo(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'jsonPayload',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedScene, CachedScene, QAfterFilterCondition>
      jsonPayloadGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'jsonPayload',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedScene, CachedScene, QAfterFilterCondition>
      jsonPayloadLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'jsonPayload',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedScene, CachedScene, QAfterFilterCondition>
      jsonPayloadBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'jsonPayload',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedScene, CachedScene, QAfterFilterCondition>
      jsonPayloadStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.startsWith(
        property: r'jsonPayload',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedScene, CachedScene, QAfterFilterCondition>
      jsonPayloadEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.endsWith(
        property: r'jsonPayload',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedScene, CachedScene, QAfterFilterCondition>
      jsonPayloadContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'jsonPayload',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedScene, CachedScene, QAfterFilterCondition>
      jsonPayloadMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'jsonPayload',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedScene, CachedScene, QAfterFilterCondition>
      jsonPayloadIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'jsonPayload',
        value: '',
      ));
    });
  }

  QueryBuilder<CachedScene, CachedScene, QAfterFilterCondition>
      jsonPayloadIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'jsonPayload',
        value: '',
      ));
    });
  }

  QueryBuilder<CachedScene, CachedScene, QAfterFilterCondition> qrIdEqualTo(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'qrId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedScene, CachedScene, QAfterFilterCondition> qrIdGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'qrId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedScene, CachedScene, QAfterFilterCondition> qrIdLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'qrId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedScene, CachedScene, QAfterFilterCondition> qrIdBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'qrId',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedScene, CachedScene, QAfterFilterCondition> qrIdStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.startsWith(
        property: r'qrId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedScene, CachedScene, QAfterFilterCondition> qrIdEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.endsWith(
        property: r'qrId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedScene, CachedScene, QAfterFilterCondition> qrIdContains(
      String value,
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'qrId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedScene, CachedScene, QAfterFilterCondition> qrIdMatches(
      String pattern,
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'qrId',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedScene, CachedScene, QAfterFilterCondition> qrIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'qrId',
        value: '',
      ));
    });
  }

  QueryBuilder<CachedScene, CachedScene, QAfterFilterCondition>
      qrIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'qrId',
        value: '',
      ));
    });
  }
}

extension CachedSceneQueryObject
    on QueryBuilder<CachedScene, CachedScene, QFilterCondition> {}

extension CachedSceneQueryLinks
    on QueryBuilder<CachedScene, CachedScene, QFilterCondition> {}

extension CachedSceneQuerySortBy
    on QueryBuilder<CachedScene, CachedScene, QSortBy> {
  QueryBuilder<CachedScene, CachedScene, QAfterSortBy> sortByCachedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'cachedAt', Sort.asc);
    });
  }

  QueryBuilder<CachedScene, CachedScene, QAfterSortBy> sortByCachedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'cachedAt', Sort.desc);
    });
  }

  QueryBuilder<CachedScene, CachedScene, QAfterSortBy> sortByJsonPayload() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'jsonPayload', Sort.asc);
    });
  }

  QueryBuilder<CachedScene, CachedScene, QAfterSortBy> sortByJsonPayloadDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'jsonPayload', Sort.desc);
    });
  }

  QueryBuilder<CachedScene, CachedScene, QAfterSortBy> sortByQrId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'qrId', Sort.asc);
    });
  }

  QueryBuilder<CachedScene, CachedScene, QAfterSortBy> sortByQrIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'qrId', Sort.desc);
    });
  }
}

extension CachedSceneQuerySortThenBy
    on QueryBuilder<CachedScene, CachedScene, QSortThenBy> {
  QueryBuilder<CachedScene, CachedScene, QAfterSortBy> thenByCachedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'cachedAt', Sort.asc);
    });
  }

  QueryBuilder<CachedScene, CachedScene, QAfterSortBy> thenByCachedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'cachedAt', Sort.desc);
    });
  }

  QueryBuilder<CachedScene, CachedScene, QAfterSortBy> thenById() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.asc);
    });
  }

  QueryBuilder<CachedScene, CachedScene, QAfterSortBy> thenByIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.desc);
    });
  }

  QueryBuilder<CachedScene, CachedScene, QAfterSortBy> thenByJsonPayload() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'jsonPayload', Sort.asc);
    });
  }

  QueryBuilder<CachedScene, CachedScene, QAfterSortBy> thenByJsonPayloadDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'jsonPayload', Sort.desc);
    });
  }

  QueryBuilder<CachedScene, CachedScene, QAfterSortBy> thenByQrId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'qrId', Sort.asc);
    });
  }

  QueryBuilder<CachedScene, CachedScene, QAfterSortBy> thenByQrIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'qrId', Sort.desc);
    });
  }
}

extension CachedSceneQueryWhereDistinct
    on QueryBuilder<CachedScene, CachedScene, QDistinct> {
  QueryBuilder<CachedScene, CachedScene, QDistinct> distinctByCachedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'cachedAt');
    });
  }

  QueryBuilder<CachedScene, CachedScene, QDistinct> distinctByJsonPayload(
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'jsonPayload', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<CachedScene, CachedScene, QDistinct> distinctByQrId(
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'qrId', caseSensitive: caseSensitive);
    });
  }
}

extension CachedSceneQueryProperty
    on QueryBuilder<CachedScene, CachedScene, QQueryProperty> {
  QueryBuilder<CachedScene, int, QQueryOperations> idProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'id');
    });
  }

  QueryBuilder<CachedScene, DateTime, QQueryOperations> cachedAtProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'cachedAt');
    });
  }

  QueryBuilder<CachedScene, String, QQueryOperations> jsonPayloadProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'jsonPayload');
    });
  }

  QueryBuilder<CachedScene, String, QQueryOperations> qrIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'qrId');
    });
  }
}
